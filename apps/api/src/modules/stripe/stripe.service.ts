import { BadRequestException, Inject, Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createHash } from 'crypto';
import Stripe from 'stripe';
import type { Stripe as StripeCore } from 'stripe/cjs/stripe.core';
import { STRIPE_CLIENT } from './stripe.constant';
import { IndividualOnboardingData, MakePaymentIntent } from './interfaces/stripe-process.interface';
import { CreateSetupCheckoutData, SetupCheckoutResponse } from './interfaces/setup-intent.interface';
import { ConfigService } from '@nestjs/config';
import { configFactory } from '../../config';
import { StripeConfigType } from '../../config/namespaces/stripe.config';
import { StripeAccount } from '../../database/entities/stripe-account.entity';
import { StripeOnboardingState } from '../../database/common/stripe-onboarding-state';
import { StripeOnboardingStatus } from './interfaces/onboarding-status.interface';
import { TransactionHelper } from '../../database/transaction.helper';
import { AzureStorageService } from '../../storage/storage.service';
import { DomainEventEmitter } from '../../events/domain-event-emitter.service';
import { StripeAccountStatusChangedEvent } from './events/stripe-account-status-changed.event';
import { AppCacheService } from '../../cache/cache.service';
@Injectable()
export class StripeService {
    private readonly logger = new Logger(StripeService.name);

    // Stripe Tax must be active: GST is exclusive and folded into the application fee, so an
    // inactive config would silently underpay the provider. Cached to avoid per-request latency.
    private taxSettingsCache: { active: boolean; checkedAt: number } | null = null;
    private static readonly TAX_SETTINGS_TTL_MS = 10 * 60 * 1000;

    private jobLineProductId?: string;
    private feeLineProductId?: string;

    constructor(
        @Inject(STRIPE_CLIENT) private readonly stripe: StripeCore,
        private readonly configService: ConfigService,
        @InjectRepository(StripeAccount) private readonly stripeAccountRepository: Repository<StripeAccount>,
        private readonly txHelper: TransactionHelper,
        private readonly azureStorageService: AzureStorageService,
        private readonly eventEmitter: DomainEventEmitter,
        private readonly cacheService: AppCacheService,
    ){};

    /** Refuse checkout unless Stripe Tax is active — otherwise GST is deducted from the provider's
     *  transfer but never charged to the seeker (silent underpay). Fails loud instead. */
    private async assertTaxConfigured(): Promise<void> {
        const now = Date.now();
        const inactiveError = new BadRequestException(
            'Payments are temporarily unavailable: Stripe Tax (GST) is not configured. Please try again shortly.',
        );

        // Serve from cache within TTL.
        if (this.taxSettingsCache && now - this.taxSettingsCache.checkedAt < StripeService.TAX_SETTINGS_TTL_MS) {
            if (!this.taxSettingsCache.active) throw inactiveError;
            return;
        }

        try {
            const settings = await (this.stripe as any).tax.settings.retrieve();
            const active = settings?.status === 'active';
            this.taxSettingsCache = { active, checkedAt: now };
            if (!active) {
                this.logger.error(`Stripe Tax not active (status=${settings?.status}) — blocking checkout`);
                throw inactiveError;
            }
        } catch (err) {
            if (err instanceof BadRequestException) throw err;
            // Transient API/network error: trust last-known-good if we have it, else fail closed.
            this.logger.error(`Could not verify Stripe Tax settings: ${(err as Error).message}`);
            if (this.taxSettingsCache?.active) return;
            throw inactiveError;
        }
    }

    // ─── Stripe Connect ──────────────────────────────────────────────────────

    // True only when a Stripe error means the account is gone / access revoked (not a transient blip),
    // so a stored row or idempotency key is cleared only on a real access loss.
    private isAccountAccessError(err: unknown): boolean {
        if (err instanceof Stripe.errors.StripePermissionError) return true;
        const e = err as any;
        const msg: string = e?.message ?? '';
        return e?.code === 'account_invalid'
            || /does not have access to account/i.test(msg)
            || /that account does not exist/i.test(msg)
            || /access may have been revoked/i.test(msg);
    }

    // Downloads a stored identity document and uploads it to Stripe, returning the file token.
    // In test mode Stripe rejects real uploads, so its canned success token is used instead.
    private async uploadIdentityDocumentToStripe(url: string, accountId: string, side: 'front' | 'back'): Promise<string> {
        const stripeKey = this.configService.get<StripeConfigType>('stripe')?.secretKey ?? '';
        if (stripeKey.startsWith('sk_test_')) {
            this.logger.log(`Test mode: using test identity document token (${side}) for accountId=${accountId}`);
            return 'file_identity_document_success';
        }

        const { buffer, contentType } = await this.azureStorageService.downloadBuffer(url);
        const ext = url.split('.').pop()?.toLowerCase() ?? 'jpg';
        const stripeFile = await this.stripe.files.create({
            purpose: 'identity_document',
            file: { data: buffer, name: `identity-${side}.${ext}`, type: contentType },
        });
        this.logger.log(`Identity document (${side}) uploaded to Stripe: fileId=${stripeFile.id} accountId=${accountId}`);
        return stripeFile.id;
    }

    async onboardIndividualAccount(data: IndividualOnboardingData): Promise<any> {
        const existing = await this.stripeAccountRepository.findOne({
            where: { provider: { id: data.userId } } as any,
        });
        if (existing?.accountId) {
            // Verify the stored account still exists; if deleted in the Dashboard, clear the ghost row and
            // bump the nonce so the create below can't replay the dead account. Transient blip → keep row.
            try {
                const live = await this.stripe.accounts.retrieve(existing.accountId);
                await this.persistStripeAccount(data.userId, live);
                return {
                    status: 'already_onboarded',
                    account_id: live.id,
                    payouts_enabled: live.payouts_enabled,
                    charges_enabled: live.charges_enabled,
                };
            } catch (err) {
                if (!this.isAccountAccessError(err)) {
                    this.logger.warn(
                        `Could not verify stored Stripe account ${existing.accountId} ` +
                        `(${(err as Error).message}); returning last-known status.`,
                    );
                    return {
                        status: 'already_onboarded',
                        account_id: existing.accountId,
                        payouts_enabled: existing.payoutsEnabled,
                        charges_enabled: existing.chargesEnabled,
                    };
                }
                this.logger.warn(`Stored Stripe account ${existing.accountId} is gone; clearing ghost row and re-onboarding.`);
                await this.stripeAccountRepository.delete({ id: (existing as any).id });
                const nk = `stripe:onboard:nonce:${data.userId}`;
                await this.cacheService.set(nk, ((await this.cacheService.get<number>(nk)) ?? 0) + 1, 24 * 60 * 60);
            }
        }

        // Idempotency key scoped to provider + request params: a rapid retry of the SAME request reuses
        // the created account (no orphan in the create→persist window), while corrected details use a new
        // key. The nonce escapes a key poisoned by a Dashboard-deleted account, whose dead create response
        // Stripe replays for ~24h — bumping it (on detection, below) forces a genuinely new account.
        const nonceKey = `stripe:onboard:nonce:${data.userId}`;
        const buildIdempotencyKey = (nonce: number) => 'onboard_' + createHash('sha256')
            .update(JSON.stringify({
                // Salt bumped when the request shape changes so keys poisoned by older bugs are sidestepped.
                v: 2,
                nonce,
                userId: data.userId,
                firstName: data.individual.firstName,
                lastName: data.individual.lastName,
                email: data.individual.email,
                dob: data.individual.dob,
                accountNumber: data.bankDetails.accountNumber,
                bsbNumber: data.bankDetails.bsbNumber,
                mcc: data.businessProfile.mcc ?? null,
            }))
            .digest('hex')
            .slice(0, 40);

        // Only tos_acceptance varies per request; the rest is stable, so retries reusing a key send a
        // byte-identical body (Stripe rejects same-key/different-body). tos is snapshotted per key.
        const baseAccountParams: Omit<StripeCore.AccountCreateParams, 'tos_acceptance'> = {
            country: 'AU',
            email: data.individual.email,
            controller: {
                stripe_dashboard: { type: 'none' },
                fees: { payer: 'application' },
                losses: { payments: 'application' },
                requirement_collection: 'application',
            },
            // Providers only receive payouts, so `transfers` is the only capability needed — requesting
            // card/debit payments would add verification requirements that can block onboarding.
            capabilities: {
                transfers: { requested: true },
            },
            business_type: 'individual',
            business_profile: {
                url: process.env.PLATFORM_URL ?? 'https://taskoraservices.com.au',
                ...(data.businessProfile.mcc && { mcc: data.businessProfile.mcc }),
            },
            individual: {
                first_name: data.individual.firstName,
                last_name: data.individual.lastName,
                email: data.individual.email,
                phone: data.individual.phone,
                dob: data.individual.dob,
                address: data.individual.address,
                ...(data.individual.idNumber && { id_number: data.individual.idNumber }),
            },
            external_account: {
                object: 'bank_account',
                country: 'AU',
                currency: 'aud',
                account_number: data.bankDetails.accountNumber,
                routing_number: data.bankDetails.bsbNumber,
                account_holder_name: data.bankDetails.accountHolderName,
            },
            metadata: {
                provider_profile_id: data.providerId,
                user_id: data.userId,
            },
        };

        try {

            // Create the account, then retrieve to VERIFY it exists: Stripe's idempotency cache can replay
            // the create response of a since-deleted account. On a replayed-dead account, bump the nonce
            // and re-create ONCE with a fresh key.
            let account: StripeCore.Account | undefined;
            let nonce = (await this.cacheService.get<number>(nonceKey)) ?? 0;
            for (let attempt = 0; attempt < 2; attempt++) {
                const idempotencyKey = buildIdempotencyKey(nonce);
                const tosCacheKey = `stripe:onboard:tos:${idempotencyKey}`;
                let tos = await this.cacheService.get<{ date: number; ip: string }>(tosCacheKey);
                if (!tos) {
                    tos = { date: Math.floor(Date.now() / 1000), ip: data.tosIpAddress };
                    await this.cacheService.set(tosCacheKey, tos, 24 * 60 * 60);
                }

                const created = await this.stripe.accounts.create(
                    { ...baseAccountParams, tos_acceptance: { date: tos.date, ip: tos.ip } },
                    { idempotencyKey },
                );

                try {
                    account = await this.stripe.accounts.retrieve(created.id);
                    break;
                } catch (verifyErr) {
                    if (this.isAccountAccessError(verifyErr) && attempt === 0) {
                        this.logger.warn(
                            `Onboarding got a replayed/deleted account ${created.id} from the idempotency ` +
                            `cache; bumping key nonce and re-creating a fresh account.`,
                        );
                        nonce += 1;
                        await this.cacheService.set(nonceKey, nonce, 24 * 60 * 60);
                        await this.cacheService.del(tosCacheKey);
                        continue;
                    }
                    throw verifyErr;
                }
            }
            if (!account) {
                // Both attempts resolved to a dead account — refuse rather than persist a ghost row.
                throw new BadRequestException('Onboarding is temporarily unavailable. Please try again shortly.');
            }

            // Persist only once verified-live, so a deleted-account replay can't leave a ghost row. A
            // create→persist crash stays recoverable: the next onboard replays the same account via the key.
            await this.persistStripeAccount(data.userId, account);

            // Identity upload is non-fatal — the account already exists (ID photo is eventually-due, not
            // blocking). A driving licence has a back; a passport is single-sided, so `back` is optional.
            if (data.individual.identityDocumentFrontUrl) {
                try {
                    const document: { front: string; back?: string } = {
                        front: await this.uploadIdentityDocumentToStripe(data.individual.identityDocumentFrontUrl, account.id, 'front'),
                    };
                    if (data.individual.identityDocumentBackUrl) {
                        const back = await this.uploadIdentityDocumentToStripe(data.individual.identityDocumentBackUrl, account.id, 'back');
                        // Stripe rejects the same file token on both sides. In test mode both sides
                        // resolve to the one canned success token, so only attach the back if it differs.
                        if (back !== document.front) document.back = back;
                    }

                    await this.stripe.accounts.update(account.id, {
                        individual: { verification: { document } } as any,
                    });
                    this.logger.log(`Identity document(s) attached to Stripe accountId=${account.id}`);
                } catch (idErr) {
                    this.logger.error(
                        `Identity document upload failed (non-fatal) accountId=${account.id}: ${(idErr as any)?.message}`,
                        (idErr as any)?.stack,
                    );
                }
            }

            // Refresh with the latest status; fall back to the created account if the sync fails —
            // the initial record is already persisted, so onboarding still counts as done.
            let finalAccount: StripeCore.Account = account;
            try {
                finalAccount = await this.stripe.accounts.retrieve(account.id);
                await this.persistStripeAccount(data.userId, finalAccount);
            } catch (syncErr) {
                this.logger.error(`Post-onboarding status sync failed accountId=${account.id}: ${(syncErr as any)?.message}`);
            }

            this.logger.log(
                `Stripe connected account onboarded: accountId=${finalAccount.id} userId=${data.userId} ` +
                `charges_enabled=${finalAccount.charges_enabled} payouts_enabled=${finalAccount.payouts_enabled} ` +
                `requirements_due=${JSON.stringify(finalAccount.requirements?.currently_due ?? [])}`,
            );

            return {
                status: 'success',
                account_id: finalAccount.id,
                payouts_enabled: finalAccount.payouts_enabled,
                charges_enabled: finalAccount.charges_enabled,
                requirements_due: finalAccount.requirements?.currently_due || [],
            };

        } catch (error) {
            // Our own user-facing errors (e.g. the dead-account refusal) pass through untouched.
            if (error instanceof BadRequestException) throw error;

            if (error instanceof Stripe.errors.StripeError) {
                const code = (error as any).code ?? '';
                const param = (error as any).param ? ` [param: ${(error as any).param}]` : '';
                // Full technical detail stays in the logs; the client gets a clean, actionable message.
                this.logger.error(`Stripe onboarding error${param} (type=${error.type}, code=${code}): ${error.message}`, error.stack);

                // Idempotency conflicts are an internal retry artifact — never surface Stripe's raw text.
                if (error.type === 'idempotency_error' || code === 'idempotency_error' || /idempotent/i.test(error.message)) {
                    throw new BadRequestException("We couldn't complete your onboarding right now. Please try again in a moment.");
                }
                // Transient infrastructure issues (connection / API / rate limit) — ask to retry.
                if (error instanceof Stripe.errors.StripeConnectionError
                    || error instanceof Stripe.errors.StripeAPIError
                    || error instanceof Stripe.errors.StripeRateLimitError) {
                    throw new BadRequestException('Onboarding is temporarily unavailable. Please try again shortly.');
                }
                // Everything else (bank/DOB/name/address validation) — Stripe's message is user-actionable.
                throw new BadRequestException(`We couldn't verify your details: ${error.message}`);
            }
            this.logger.error(`Non-Stripe onboarding error (${(error as any)?.name ?? 'Error'}/${(error as any)?.code ?? '-'}): ${(error as any)?.message}`, (error as any)?.stack);
            throw new InternalServerErrorException('An unexpected error occurred during onboarding');
        }
    }

    // Upsert the provider's StripeAccount row from a Stripe account object.
    private async persistStripeAccount(userId: string, account: StripeCore.Account): Promise<void> {
        const snapshot = this.deriveOnboardingSnapshot(account);
        const existing = await this.stripeAccountRepository.findOne({
            where: { provider: { id: userId } } as any,
        });
        const record = existing ?? this.stripeAccountRepository.create({ provider: { id: userId } as any });
        record.accountId = account.id;
        record.detailsSubmitted = account.details_submitted ?? false;
        record.chargesEnabled = account.charges_enabled ?? false;
        record.payoutsEnabled = account.payouts_enabled ?? false;
        if (account.charges_enabled && account.payouts_enabled && !record.onboardingCompletedAt) {
            record.onboardingCompletedAt = new Date();
        }
        record.onboardingState = snapshot.state;
        record.requirementsDue = snapshot.requirementsDue;
        record.disabledReason = snapshot.disabledReason;
        record.requirementsSyncedAt = new Date();
        await this.stripeAccountRepository.save(record);
    }

    /**
     * Live check, for the money-out moment (checkout), that a provider's connected account is fully
     * verified and enabled RIGHT NOW. The bid gate only proves the account was enabled when the bid
     * was placed; Stripe verifies asynchronously and can restrict an account afterwards, so we always
     * re-fetch from Stripe rather than trust the stored row. Falls back to the last known state only
     * if Stripe is unreachable, so an outage doesn't block an otherwise-good payment.
     */
    async assertProviderPayoutEnabled(providerUserId: string): Promise<void> {
        const record = await this.stripeAccountRepository.findOne({
            where: { provider: { id: providerUserId } } as any,
        });
        if (!record?.accountId) {
            throw new BadRequestException({
                message: 'This provider has not connected a Stripe payout account yet.',
                errorCode: 'STRIPE_ACCOUNT_NOT_CONNECTED',
            });
        }

        let state: StripeOnboardingState = record.onboardingState;
        try {
            const account = await this.stripe.accounts.retrieve(record.accountId);
            await this.persistStripeAccount(providerUserId, account);
            state = this.deriveOnboardingSnapshot(account).state;
        } catch (error) {
            // Stripe unreachable — fall back to the last synced state rather than block a legit
            // payment; the stored state is the best information we have.
            this.logger.warn(
                `Could not live-verify payout readiness for ${record.accountId}; using stored state '${state}': ${(error as Error).message}`,
            );
        }

        if (state !== 'enabled') {
            throw new BadRequestException({
                message: 'This provider cannot receive payments yet — their Stripe verification is incomplete. Please try again once they are verified.',
                errorCode: 'PROVIDER_STRIPE_NOT_ENABLED',
            });
        }
    }

    async getOnboardingStatus(userId: string): Promise<StripeOnboardingStatus> {
        const record = await this.stripeAccountRepository.findOne({
            where: { provider: { id: userId } } as any,
            relations: { provider: true },
        });

        if (!record) {
            return {
                onboarded: false,
                state: 'not_started',
                chargesEnabled: false,
                payoutsEnabled: false,
                requirementsDue: [],
                disabledReason: null,
                onboardingCompletedAt: null,
                requirementsSyncedAt: null,
                email: null,
            };
        }

        let { onboardingState, requirementsDue, disabledReason, requirementsSyncedAt } = record;

        // Normally served from the last account.updated webhook to avoid a Stripe round trip per poll.
        // But re-sync when never synced (pre-column / missed webhook) or not yet 'enabled': Stripe enables
        // capabilities optimistically and the webhook can be missed, so polling is the reliable path to
        // catch a completed/failed verification. Once 'enabled', the webhook maintains it.
        if (!requirementsSyncedAt || onboardingState !== 'enabled') {
            try {
                const account = await this.stripe.accounts.retrieve(record.accountId);
                const snapshot = this.deriveOnboardingSnapshot(account);
                onboardingState = snapshot.state;
                requirementsDue = snapshot.requirementsDue;
                disabledReason = snapshot.disabledReason;
                requirementsSyncedAt = new Date();

                await this.stripeAccountRepository.update(record.id, {
                    chargesEnabled: account.charges_enabled ?? false,
                    payoutsEnabled: account.payouts_enabled ?? false,
                    onboardingState,
                    requirementsDue,
                    disabledReason,
                    requirementsSyncedAt,
                });
                record.chargesEnabled = account.charges_enabled ?? false;
                record.payoutsEnabled = account.payouts_enabled ?? false;
            } catch (error) {
                // Never fail the status read on a Stripe outage — fall through to the stored booleans.
                this.logger.warn(
                    `Could not backfill onboarding state for ${record.accountId}: ${(error as Error).message}`,
                );
            }
        }

        return {
            // Tied to the strict onboarding state, not the raw booleans — Stripe sets those true while
            // still verifying, so the booleans alone would report an under-review account as onboarded.
            onboarded: onboardingState === 'enabled',
            state: onboardingState,
            chargesEnabled: record.chargesEnabled,
            payoutsEnabled: record.payoutsEnabled,
            requirementsDue: requirementsDue ?? [],
            disabledReason: disabledReason ?? null,
            onboardingCompletedAt: record.onboardingCompletedAt ?? null,
            requirementsSyncedAt: requirementsSyncedAt ?? null,
            email: record.provider?.email ?? null,
        };
    }

    /** Create a single-use Stripe hosted Account Link so a provider can clear outstanding onboarding
     *  requirements. Safety net when server-side onboarding leaves the account currently_due/past_due.
     *  On expiry Stripe redirects to refresh_url, where the frontend should request a fresh link. */
    async createOnboardingAccountLink(userId: string): Promise<{ url: string }> {
        const record = await this.stripeAccountRepository.findOne({
            where: { provider: { id: userId } } as any,
        });
        if (!record) {
            throw new BadRequestException(
                'No Stripe account found. Please initiate onboarding before requesting an onboarding link.',
            );
        }

        const base = process.env.PLATFORM_URL ?? 'https://taskoraservices.com.au';
        const refreshUrl = process.env.STRIPE_CONNECT_REFRESH_URL ?? `${base}/provider/onboarding/refresh`;
        const returnUrl = process.env.STRIPE_CONNECT_RETURN_URL ?? `${base}/provider/onboarding/complete`;

        const link = await this.stripe.accountLinks.create({
            account: record.accountId,
            refresh_url: refreshUrl,
            return_url: returnUrl,
            type: 'account_onboarding',
        });

        return { url: link.url };
    }

    // Retrieve connect account
    async retrieveConnectedAccount(accountId: string): Promise<any>{
        try {
            return await this.stripe.accounts.retrieve(accountId);
        } catch (error) {
            throw error;
        }
    }

    /** Retrieve a connected account's Stripe balance (used to detect negative balance after a transfer reversal). */
    async retrieveConnectedBalance(accountId: string): Promise<StripeCore.Balance> {
        return this.stripe.balance.retrieve({}, { stripeAccount: accountId });
    }

    // ─── Customers ───────────────────────────────────────────────────────────

    // Create stripe customer
    async create(customerName: string, customerEmail: string, userId: string): Promise<any>{
        try {
            const params: Record<string, unknown> = {
                name: customerName,
                email: customerEmail,
                metadata: { customer_user_id: userId },
            };
            // TEST ONLY: attach a test clock so subscription cycles can be fast-forwarded. Hard-guarded
            // off in live so a real customer is never put on a clock.
            const testClockId = await this.maybeCreateTestClock();
            if (testClockId) params.test_clock = testClockId;
            return await this.stripe.customers.create(params as any);
        } catch (error) {
            throw error;
        }
    }

    /** True only in a NON-live environment with STRIPE_TEST_CLOCK_ENABLED=true. Never true in live. */
    private isTestClockMode(): boolean {
        const enabled = process.env['STRIPE_TEST_CLOCK_ENABLED'] === 'true';
        const isLive = (process.env['STRIPE_SEC_KEY'] ?? '').startsWith('sk_live');
        return enabled && !isLive;
    }

    /** Returns a fresh test-clock id when test-clock mode is on, else null. Never blocks customer creation. */
    private async maybeCreateTestClock(): Promise<string | null> {
        if (!this.isTestClockMode()) return null;
        try {
            const clock = await (this.stripe as any).testHelpers.testClocks.create({
                frozen_time: Math.floor(Date.now() / 1000),
                name: 'Taskora auto test clock',
            });
            this.logger.warn(`Created Stripe TEST CLOCK ${clock.id} (test mode only)`);
            return clock.id as string;
        } catch (err) {
            this.logger.error(`Failed to create test clock: ${(err as Error).message}`);
            return null;
        }
    }

    /**
     * TEST ONLY: advance a customer's test clock to a future unix time so Stripe generates the next
     * subscription cycle(s) — invoices, charges and webhooks — on demand. Refuses to run in live.
     */
    async advanceTestClock(testClockId: string, frozenTime: number): Promise<any> {
        if ((process.env['STRIPE_SEC_KEY'] ?? '').startsWith('sk_live')) {
            throw new Error('Test clocks are not available in live mode');
        }
        return (this.stripe as any).testHelpers.testClocks.advance(testClockId, { frozen_time: frozenTime });
    }

    // Retrieve customer
    async customerRetrieve(customerId: string): Promise<any>{
        try {
            return await this.stripe.customers.retrieve(customerId);
        } catch (error) {
            throw error;
        }
    }

    // ─── Payments ────────────────────────────────────────────────────────────

    // Save payment method in stripe
    async savePaymentMethod(paymentMethodId: string, customerId: string): Promise<any>{
        const attachedPaymentMethod = await this.stripe.paymentMethods.attach(
            paymentMethodId,
            { customer: customerId }
        );

        return attachedPaymentMethod;
    }

    // create payment intent and save card info
    async createPaymentIntent(paymentInfo: MakePaymentIntent): Promise<any>{
        try {
            // create payment intent
            const paymentIntent=await this.stripe.paymentIntents.create({
                amount: paymentInfo.amount,
                currency: 'aud',
                customer: paymentInfo.customer,
                payment_method: paymentInfo.paymentMethod,
                setup_future_usage: paymentInfo.futureUsage ? 'off_session': 'on_session',
                confirm: true,

                transfer_data:{
                    destination: paymentInfo.providerAccountId
                },
                application_fee_amount: paymentInfo.applicationFeeAmount,

                metadata:{
                    job_id: paymentInfo.jobId,
                    customer_id: paymentInfo.customer,
                    provider_id: paymentInfo.providerAccountId,
                    seeker_user_id: paymentInfo.seekerUserId,
                    provider_user_id: paymentInfo.providerUserId,
                    tax_gst_amount: paymentInfo.taxGstAmmount
                }
            });

            return {
                client_secret: paymentIntent.client_secret,
                payment_intent_id: paymentIntent.id
            };
        } catch (error) {
            throw error;
        }
    }

    // used for deep extraction of payment intent data
    async getLatestCharge(paymentIntentId: string): Promise<any>{
        const paymentIntent=await this.stripe.paymentIntents.retrieve(
            paymentIntentId,
            {
                expand: ['latest_charge']
            }
        );

        return paymentIntent;
    }

    // get payment details
    async getPaymentDetails(paymentIntentId: string): Promise<any>{

        try {
            
            const paymentIntent=await this.stripe.paymentIntents.retrieve(paymentIntentId);

            return {
                id: paymentIntent.id,
                amount: paymentIntent.amount,
                currency: paymentIntent.currency,
                status: paymentIntent.status,
                created: paymentIntent
                .created,
                customer: paymentIntent.customer,
                provider: paymentIntent.metadata?.provider_id
            };
        } catch (error) {
            throw error;
        }
    }

    // Detach payment method from Stripe (remove card)
    async detachPaymentMethod(paymentMethodId: string): Promise<void> {
        try {
            await this.stripe.paymentMethods.detach(paymentMethodId);
        } catch (error) {
            throw error;
        }
    }

    // ─── Setup Checkout (Add Card) ───────────────────────────────────────────

    /** Create a setup-mode Checkout Session; returns a hosted URL for entering card details.
     *  Stripe fires setup_intent.succeeded on completion and the webhook saves the card. */
    async createSetupCheckoutSession(data: CreateSetupCheckoutData): Promise<SetupCheckoutResponse> {
        try {
            const session = await this.stripe.checkout.sessions.create({
                mode: 'setup',
                customer: data.customerId,
                payment_method_types: ['card'],
                success_url: data.successUrl,
                cancel_url: data.cancelUrl,
                setup_intent_data: {
                    metadata: {
                        user_id: data.userId,
                        customer_id: data.customerId,
                    },
                },
            } as any);

            this.logger.log(
                `Checkout session created: id="${session.id}", customerId="${data.customerId}", userId="${data.userId}"`,
            );

            return {
                checkoutUrl: session.url!,
                sessionId: session.id,
            };
        } catch (error) {
            this.logger.error(`Failed to create checkout session: ${(error as Error).message}`);
            throw error;
        }
    }

    /** Retrieve a checkout session with setup_intent expanded. */
    async retrieveCheckoutSession(sessionId: string): Promise<any> {
        try {
            return await this.stripe.checkout.sessions.retrieve(sessionId, {
                expand: ['setup_intent', 'setup_intent.payment_method'],
            });
        } catch (error) {
            this.logger.error(`Failed to retrieve checkout session ${sessionId}: ${(error as Error).message}`);
            throw error;
        }
    }

    /** Retrieve a setup intent (payment_method expanded). */
    async retrieveSetupIntent(setupIntentId: string): Promise<StripeCore.SetupIntent> {
        try {
            return await this.stripe.setupIntents.retrieve(setupIntentId, {
                expand: ['payment_method'],
            });
        } catch (error) {
            this.logger.error(`Failed to retrieve setup intent ${setupIntentId}: ${(error as Error).message}`);
            throw error;
        }
    }

    /** Retrieve card details for a payment method (null if not a card). */
    async getPaymentMethodDetails(paymentMethodId: string): Promise<any> {
        try {
            const paymentMethod = await this.stripe.paymentMethods.retrieve(paymentMethodId);

            if (paymentMethod.type === 'card' && paymentMethod.card) {
                return {
                    id: paymentMethod.id,
                    brand: paymentMethod.card.brand,
                    last4: paymentMethod.card.last4,
                    expMonth: paymentMethod.card.exp_month,
                    expYear: paymentMethod.card.exp_year,
                    fingerprint: paymentMethod.card.fingerprint ?? null,
                };
            }

            return null;
        } catch (error) {
            this.logger.error(`Failed to retrieve payment method ${paymentMethodId}: ${(error as Error).message}`);
            throw error;
        }
    }

    // ─── Payment Checkout ────────────────────────────────────────────────────

    /** Create a Checkout Session for a single-task job payment. Two line items (job price + service fee):
     *  the provider receives the full job price via the destination transfer and the fee becomes the
     *  application fee. Saved cards are shown automatically. */
    async createPaymentCheckoutSession(
        customerId: string,
        jobPriceCents: number,
        serviceFeeCents: number,
        jobId: string,
        seekerId: string,
        providerId: string,
        providerStripeAccountId: string,
        successUrl: string,
        cancelUrl: string,
        jobRef: string,
        jobTitle: string,
        platformChargePercent: number,
    ): Promise<{ url: string; sessionId: string }> {
        try {
            await this.assertTaxConfigured();
            const session = await this.stripe.checkout.sessions.create({
                mode: 'payment',
                customer: customerId,
                line_items: [
                    {
                        // Provider's service — non-taxable in the agent model (provider handles own GST);
                        // received in full via the destination transfer.
                        quantity: 1,
                        price_data: {
                            currency: 'aud',
                            unit_amount: jobPriceCents,
                            tax_behavior: 'inclusive',
                            product_data: {
                                name: `${jobRef} — ${jobTitle}`,
                                description: 'Service payment',
                                tax_code: 'txcd_00000000', // Non-taxable
                            },
                        },
                    },
                    {
                        // Taskora's service fee — GST-inclusive; GST is calculated on this line only.
                        quantity: 1,
                        price_data: {
                            currency: 'aud',
                            unit_amount: serviceFeeCents,
                            tax_behavior: 'inclusive',
                            product_data: {
                                name: `Taskora service fee (${platformChargePercent}%)`,
                            },
                        },
                    },
                ],
                automatic_tax: { enabled: true },
                customer_update: { address: 'auto' },
                payment_intent_data: {
                    application_fee_amount: serviceFeeCents,
                    transfer_data: {
                        destination: providerStripeAccountId,
                    },
                    metadata: {
                        job_id: jobId,
                        job_ref: jobRef,
                        job_title: jobTitle,
                        flow: 'job_payment',
                        // Carried so the invoice can label the fee with the exact % that was applied.
                        platform_charge_percent: String(platformChargePercent),
                    },
                },
                saved_payment_method_options: {
                    allow_redisplay_filters: ['always'],
                    payment_method_save: 'enabled',
                },
                metadata: { jobId, seekerId, providerId, flow: 'job_payment' },
                success_url: successUrl,
                cancel_url: cancelUrl,
            } as any);

            if (!session.url) {
                throw new Error('Checkout session created but URL not available');
            }

            this.logger.log(
                `Payment checkout session created: id=${session.id}, jobId=${jobId}, jobPrice=${jobPriceCents}c, fee=${serviceFeeCents}c`,
            );

            return { url: session.url, sessionId: session.id };
        } catch (error) {
            this.logger.error(`Failed to create payment checkout session: ${(error as Error).message}`);
            throw error;
        }
    }

    // ─── Subscriptions ───────────────────────────────────────────────────────

    // create subscription checkout session
    async createSubscriptionCheckout(customerId: string, priceId: string): Promise<any>{

        try {
            
            const subscriptionSession=await this.stripe.checkout.sessions.create({
                mode: 'subscription',
                customer: customerId,

                line_items:[
                    {
                        price: priceId, // The ID of the monthly/yearly plan from Stripe Dashboard
                        quantity: 1
                    }
                ],

                // ---------Hardcoded For Now----------
                success_url: 'http://localhost:3000/api/me',
                cancel_url: 'http://localhost:3000/api/me',
                // ------------------------------------

                metadata:{
                    customer_id: customerId
                }
            });

            return{
                checkout_url: subscriptionSession.url,
                session_id: subscriptionSession.id
            };
        } catch (error) {
            throw error;
        }
    }

    // Get Subscription by ID
    async getSubscriptionById(subscriptionId: string): Promise<any> {
        try {
            const subscription = await this.stripe.subscriptions.retrieve(subscriptionId);
            return subscription;
        } catch (error) {
            throw error;
        }
    }

    // Get Current Subscription Period Details
    async getSubscriptionPeriod(subscriptionId: string): Promise<any> {
        try {
            const subscription = await this.stripe.subscriptions.retrieve(subscriptionId);
            
            // Extract the first subscription item (which holds the billing period details)
            const subscriptionItem = subscription.items.data[0];
            
            return {
                subscription_id: subscription.id,
                status: subscription.status, // 'active', 'past_due', 'canceled', etc.
                
                // Fetching timestamps from the nested subscriptionItem instead
                current_period_start: subscriptionItem ? new Date(subscriptionItem.current_period_start * 1000).toISOString() : '',
                current_period_end: subscriptionItem ? new Date(subscriptionItem.current_period_end * 1000).toISOString(): '',
                
                cancel_at_period_end: subscription.cancel_at_period_end
            };
        } catch (error) {
            throw error;
        }
    }

    /** Schedule cancellation at a future time (the 14-day notice date) with no further charges and no
     *  refund of paid cycles. Collection is paused (invoices in the notice window are voided); at the
     *  cancel time Stripe fires customer.subscription.deleted and the webhook finalizes the job. */
    async scheduleSubscriptionCancellation(
        subscriptionId: string,
        cancelAtUnixSeconds: number,
        reason?: string,
    ): Promise<StripeCore.Subscription> {
        try {
            return await this.stripe.subscriptions.update(subscriptionId, {
                cancel_at: cancelAtUnixSeconds,
                proration_behavior: 'none',
                pause_collection: { behavior: 'void' },
                cancellation_details: reason ? { comment: reason } : undefined,
                metadata: reason ? { cancellation_reason: reason } : undefined,
            });
        } catch (error) {
            this.logger.error(
                `Failed to schedule cancellation for subscription ${subscriptionId}: ${(error as Error).message}`,
            );
            throw error;
        }
    }

    /** Cancel immediately (no notice) — used when the subscription never started billing, so there's
     *  nothing to give notice about and the seeker can exit even an `incomplete` subscription.
     *  Stripe fires customer.subscription.deleted, which the webhook finalizes. */
    async cancelSubscriptionImmediately(
        subscriptionId: string,
        reason?: string,
    ): Promise<StripeCore.Subscription> {
        try {
            return await this.stripe.subscriptions.cancel(subscriptionId, {
                cancellation_details: reason ? { comment: reason } : undefined,
            });
        } catch (error) {
            this.logger.error(
                `Failed to cancel subscription ${subscriptionId} immediately: ${(error as Error).message}`,
            );
            throw error;
        }
    }

    // ─── Webhook ─────────────────────────────────────────────────────────────

    // verify webhook signature
    verifyWebhookSignature(body: string, signature: string): StripeCore.Event{

        const stripeConfig = configFactory<StripeConfigType>(this.configService, 'stripe');
        // Two webhook endpoints on the same URL ("Your account" + "Connected accounts"), each with its
        // own signing secret, so an event is valid if it matches EITHER.
        const secrets = [stripeConfig.webhookSecret, stripeConfig.webhookSecretConnect].filter(Boolean);

        if (!secrets.length) {
            throw new BadRequestException('Webhook secret not configured');
        }

        for (const secret of secrets) {
            try {
                return this.stripe.webhooks.constructEvent(body, signature, secret);
            } catch (error) {
                // Signature mismatch = not this endpoint's secret, try the next; any other error is fatal.
                if (!(error instanceof Stripe.errors.StripeSignatureVerificationError)) {
                    throw error;
                }
            }
        }

        throw new BadRequestException('Invalid webhook signature');
    }

    // ─── Connect — Bank Account ──────────────────────────────────────────────

    async updateExternalBankAccount(
        userId: string,
        accountNumber: string,
        bsbNumber: string,
        accountHolderName: string,
    ): Promise<void> {
        const record = await this.stripeAccountRepository.findOne({
            where: { provider: { id: userId } } as any,
        });
        if (!record) return;

        // Capture existing bank accounts before adding the new one, so the stale ones can be removed
        // afterwards — otherwise each update would leave an orphaned external account behind.
        const existing = await this.stripe.accounts.listExternalAccounts(record.accountId, {
            object: 'bank_account',
            limit: 100,
        });
        const staleBankAccountIds = existing.data.map((ba) => ba.id);

        // default_for_currency:true makes the new account the default, so the old ones become safe to delete.
        await this.stripe.accounts.createExternalAccount(record.accountId, {
            external_account: {
                object: 'bank_account',
                country: 'AU',
                currency: 'aud',
                account_number: accountNumber,
                routing_number: bsbNumber,
                account_holder_name: accountHolderName,
                default_for_currency: true,
            } as any,
        });

        // Best-effort cleanup of the old bank account(s) — a failure here must not fail the update.
        for (const staleId of staleBankAccountIds) {
            try {
                await this.stripe.accounts.deleteExternalAccount(record.accountId, staleId);
            } catch (err) {
                this.logger.warn(
                    `Could not delete stale external account ${staleId} on ${record.accountId}: ${(err as Error).message}`,
                );
            }
        }

        this.logger.log(
            `External bank account updated for Stripe account ${record.accountId} (userId=${userId}); ` +
            `removed ${staleBankAccountIds.length} stale account(s)`,
        );
    }

    // ─── Stripe Identity ─────────────────────────────────────────────────────

    async createIdentityVerificationSession(
        stepId: string,
        profileId: string,
        returnUrl: string,
    ): Promise<{ sessionId: string; url: string }> {
        const session = await this.stripe.identity.verificationSessions.create({
            type: 'document',
            options: {
                document: {
                    require_live_capture: true,
                    require_matching_selfie: true,
                },
            },
            return_url: returnUrl,
            metadata: { step_id: stepId, profile_id: profileId },
        } as any);

        return { sessionId: session.id, url: session.url! };
    }

    /**
     * Handle account.updated webhook event from Stripe
     *
     * This method processes onboarding completion events for Stripe Connect accounts.
     * When a provider's account is ready for payouts and card charges, this handler:
     * 1. Finds the StripeAccount record using the Stripe account ID
     * 2. Updates the record with current account status (payoutsEnabled, chargesEnabled)
     * 3. Sets the onboardingCompletedAt timestamp if onboarding is complete
     * 
     * Business logic:
     * - Onboarding is considered complete when BOTH payouts_enabled and charges_enabled are true
     * - Uses idempotent find-and-update pattern to prevent duplicate processing
     * - Logs all updates for audit purposes
     * 
     * @param account - The Stripe Account object from the webhook event
     * @throws BadRequestException - If account ID is missing
     * @throws InternalServerErrorException - If database operation fails
     */
    async handleAccountUpdatedEvent(account: StripeCore.Account): Promise<void> {
        try {
            if (!account.id) {
                throw new BadRequestException('Stripe account ID is missing in webhook payload');
            }

            const stripeConnectAccountId = account.id;
            const payoutsEnabled = account.payouts_enabled || false;
            const chargesEnabled = account.charges_enabled || false;
            const isOnboardingComplete = payoutsEnabled && chargesEnabled;

            this.logger.debug(
                `Processing account.updated event for ${stripeConnectAccountId}: ` +
                `payouts_enabled=${payoutsEnabled}, charges_enabled=${chargesEnabled}`,
            );

            // Provider-facing status: 'enabled' (payouts+charges live), 'action_required' (not enabled and
            // Stripe needs the provider to act), or 'pending' (still in normal verification — do NOT notify).
            const notifyStatus: 'enabled' | 'action_required' | 'pending' = isOnboardingComplete
                ? 'enabled'
                : this.isPayoutActionRequired(account)
                    ? 'action_required'
                    : 'pending';

            // Decided inside the transaction (needs the persisted lastNotifiedStatus for dedup),
            // emitted only after commit so we never notify on a write that rolled back.
            let shouldNotify = false;
            let providerUserId: string | null = null;

            // What /me/stripe/status will show. Derived separately from notifyStatus above —
            // see deriveOnboardingSnapshot for why the two thresholds differ.
            const snapshot = this.deriveOnboardingSnapshot(account);

            await this.txHelper.run(async (qr) => {
                // provider relation loaded so we know who to notify on a status transition.
                let stripeAccountRecord = await qr.manager.findOne(StripeAccount, {
                    where: { accountId: stripeConnectAccountId },
                    relations: { provider: true },
                });

                // account.updated fires for orphan accounts we have no provider row for. We can't create
                // one (provider is NOT NULL) and there's nothing to do, so skip and return 200.
                if (!stripeAccountRecord) {
                    this.logger.warn(
                        `No StripeAccount row for account ${stripeConnectAccountId}; ignoring account.updated ` +
                        `(orphan, or account created outside the onboarding flow).`,
                    );
                    return;
                }

                providerUserId = stripeAccountRecord.provider?.id ?? null;

                stripeAccountRecord.chargesEnabled = chargesEnabled;
                stripeAccountRecord.payoutsEnabled = payoutsEnabled;

                // Set completion timestamp only on the first transition to complete.
                if (isOnboardingComplete && !stripeAccountRecord.onboardingCompletedAt) {
                    stripeAccountRecord.onboardingCompletedAt = new Date();
                    this.logger.log(`Onboarding completed for Stripe account ${stripeConnectAccountId}`);
                }

                // Notify once per meaningful change: only when the status is notifiable
                // ('enabled' / 'action_required') AND differs from what we last told them.
                if (notifyStatus !== 'pending' && notifyStatus !== stripeAccountRecord.lastNotifiedStatus) {
                    shouldNotify = true;
                    stripeAccountRecord.lastNotifiedStatus = notifyStatus;
                }

                // This event is the freshest word from Stripe on what is outstanding, so it wins.
                stripeAccountRecord.onboardingState = snapshot.state;
                stripeAccountRecord.requirementsDue = snapshot.requirementsDue;
                stripeAccountRecord.disabledReason = snapshot.disabledReason;
                stripeAccountRecord.requirementsSyncedAt = new Date();

                await qr.manager.save(StripeAccount, stripeAccountRecord);

                this.logger.debug(
                    `Updated StripeAccount record: accountId=${stripeConnectAccountId}, ` +
                    `payoutsEnabled=${payoutsEnabled}, chargesEnabled=${chargesEnabled}, ` +
                    `onboardingCompletedAt=${stripeAccountRecord.onboardingCompletedAt || 'null'}`,
                );
            });

            // Emit outside the transaction (after commit). Guarded by providerUserId so the
            // fallback-create edge case (no known provider) never emits.
            if (providerUserId && shouldNotify) {
                this.eventEmitter.emit(
                    new StripeAccountStatusChangedEvent(
                        providerUserId,
                        notifyStatus as 'enabled' | 'action_required',
                        stripeConnectAccountId,
                        notifyStatus === 'action_required' ? (account.requirements?.disabled_reason ?? null) : null,
                    ),
                );
            }
        } catch (error) {
            if (error instanceof BadRequestException) {
                throw error;
            }

            this.logger.error(
                `Failed to handle account.updated event: ${(error as Error).message}`,
                (error as Error).stack,
            );
            throw new InternalServerErrorException(
                `Failed to process Stripe account update: ${(error as Error).message}`,
            );
        }
    }

    /** True when the PROVIDER must act before payouts enable (past_due, or a blocking disabled_reason),
     *  as opposed to in-progress verification (pending_verification / under_review), which we ignore. */
    private isPayoutActionRequired(account: StripeCore.Account): boolean {
        const req = account.requirements;
        if (!req) return false;

        if ((req.past_due?.length ?? 0) > 0) return true;

        const reason = req.disabled_reason ?? null;
        const inProgressReasons = new Set(['requirements.pending_verification', 'under_review']);
        if (reason && !inProgressReasons.has(reason)) return true;

        return false;
    }

    /** Snapshot for the provider-facing status endpoint. Threshold differs from isPayoutActionRequired
     *  deliberately: this reports `action_required` as soon as anything is `currently_due` (the status
     *  screen shows work early), while notifications fire only on `past_due` — so an account can be
     *  `action_required` here with no notification sent. */
    deriveOnboardingSnapshot(account: StripeCore.Account): {
        state: Exclude<StripeOnboardingState, 'not_started'>;
        requirementsDue: string[];
        disabledReason: string | null;
    } {
        const req = account.requirements;
        const enabled = (account.charges_enabled ?? false) && (account.payouts_enabled ?? false);

        // currently_due is what Stripe wants before the deadline; past_due is what is already
        // overdue. Both are the provider's problem, so present them as one list.
        const requirementsDue = [
            ...new Set([...(req?.currently_due ?? []), ...(req?.past_due ?? [])]),
        ];
        const disabledReason = req?.disabled_reason ?? null;

        // Stripe enables charges/payouts optimistically while verifying in the background, so the booleans
        // alone don't mean "verified": a failed check surfaces in `errors`, an in-flight one in
        // pending_verification. Either must block payouts.
        const hasErrors = (req?.errors?.length ?? 0) > 0;
        const underReview = (req?.pending_verification?.length ?? 0) > 0;

        const blockingReason =
            disabledReason !== null &&
            !['requirements.pending_verification', 'under_review'].includes(disabledReason);

        // 'enabled' is deliberately strict: charges + payouts live AND nothing outstanding AND no
        // verification errors AND nothing still under review. Anything less blocks the provider.
        const needsAction = requirementsDue.length > 0 || hasErrors || blockingReason;
        const state: Exclude<StripeOnboardingState, 'not_started'> = needsAction
            ? 'action_required'
            : enabled && !underReview
                ? 'enabled'
                : 'pending';

        return { state, requirementsDue, disabledReason };
    }

    /** Create a subscription-mode Checkout Session for a job paid in installments. Two recurring line
     *  items per cycle (installment + service fee); the provider receives the installment portion via
     *  the transfer each cycle. */
    async createSubscriptionCheckoutSession(
        customerId: string,
        installmentAmountCents: number,
        serviceFeeCents: number,
        stripeInterval: { interval: 'week' | 'month'; interval_count: number },
        numberOfPeriods: number,
        selectionId: string,
        jobId: string,
        seekerId: string,
        providerId: string,
        providerStripeAccountId: string,
        successUrl: string,
        cancelUrl: string,
        providerPercent: number,
        jobRef: string,
        jobTitle: string,
        frequencyLabel: string,
        platformChargePercent: number,
    ): Promise<{ url: string; sessionId: string }> {
        try {
            await this.assertTaxConfigured();
            const sharedMetadata = {
                selectionId,
                jobId,
                seekerId,
                providerId,
                providerStripeAccountId,
                numberOfPeriods: numberOfPeriods.toString(),
                flow: 'job_subscription',
                jobRef,
                jobTitle,
                installmentAmount: (installmentAmountCents / 100).toFixed(2),
            };

            const installmentDollars = (installmentAmountCents / 100).toFixed(2);
            const totalDollars = ((installmentAmountCents * numberOfPeriods) / 100).toFixed(2);

            const session = await this.stripe.checkout.sessions.create({
                mode: 'subscription',
                customer: customerId,
                payment_method_types: ['card'],
                line_items: [
                    {
                        // Provider's installment — non-taxable; received in full each cycle via the transfer.
                        quantity: 1,
                        price_data: {
                            currency: 'aud',
                            unit_amount: installmentAmountCents,
                            tax_behavior: 'inclusive',
                            recurring: {
                                interval: stripeInterval.interval,
                                interval_count: stripeInterval.interval_count,
                            },
                            product_data: {
                                // Installment note mirrors the final summary invoice so every document is consistent.
                                name: `${jobRef} — ${jobTitle} (${numberOfPeriods} installments of A$${installmentDollars})`,
                                description: `${frequencyLabel} installment`,
                                tax_code: 'txcd_00000000', // Non-taxable
                            },
                        },
                    },
                    {
                        // Taskora service fee per cycle — GST-inclusive; GST is calculated on this line only.
                        quantity: 1,
                        price_data: {
                            currency: 'aud',
                            unit_amount: serviceFeeCents,
                            tax_behavior: 'inclusive',
                            recurring: {
                                interval: stripeInterval.interval,
                                interval_count: stripeInterval.interval_count,
                            },
                            product_data: {
                                name: `Taskora service fee (${platformChargePercent}%)`,
                            },
                        },
                    },
                ],
                automatic_tax: { enabled: true },
                customer_update: { address: 'auto' },
                subscription_data: {
                    description: `${numberOfPeriods} × A$${installmentDollars} ${frequencyLabel.toLowerCase()} installments = A$${totalDollars} total contract value`,
                    metadata: sharedMetadata,
                    transfer_data: {
                        destination: providerStripeAccountId,
                        amount_percent: providerPercent,
                    },
                },
                metadata: sharedMetadata,
                saved_payment_method_options: {
                    allow_redisplay_filters: ['always'],
                    payment_method_save: 'enabled',
                },
                success_url: successUrl,
                cancel_url: cancelUrl,
            } as any);

            if (!session.url) {
                throw new Error('Checkout session created but URL not available');
            }

            this.logger.log(
                `Subscription checkout session created: id=${session.id}, selectionId=${selectionId}, periods=${numberOfPeriods}, installment=${installmentAmountCents}c`,
            );

            return {
                url: session.url,
                sessionId: session.id,
            };
        } catch (error) {
            this.logger.error(
                `Failed to create subscription checkout session: ${(error as Error).message}`,
            );
            throw error;
        }
    }

    /** Retrieve a subscription by ID, optionally expanding nested objects. */
    async getSubscription(subscriptionId: string, expand?: string[]): Promise<StripeCore.Subscription> {
        try {
            return await this.stripe.subscriptions.retrieve(
                subscriptionId,
                expand?.length ? { expand } : undefined,
            );
        } catch (error) {
            this.logger.error(
                `Failed to retrieve subscription ${subscriptionId}: ${(error as Error).message}`,
            );
            throw error;
        }
    }

    async updateInvoiceDescription(invoiceId: string, description: string): Promise<void> {
        try {
            await this.stripe.invoices.update(invoiceId, { description } as any);
        } catch (error) {
            this.logger.error(`Failed to update invoice ${invoiceId} description: ${(error as Error).message}`);
            throw error;
        }
    }

    async updatePaymentIntentMetadata(paymentIntentId: string, metadata: Record<string, string>): Promise<void> {
        await this.stripe.paymentIntents.update(paymentIntentId, { metadata });
    }

    async getInvoice(invoiceId: string, expand?: string[]): Promise<any> {
        try {
            return await this.stripe.invoices.retrieve(
                invoiceId,
                expand?.length ? { expand } : undefined,
            );
        } catch (error) {
            this.logger.error(
                `Failed to retrieve invoice ${invoiceId}: ${(error as Error).message}`,
            );
            throw error;
        }
    }

    /** Retrieve a checkout session by ID (subscription expanded by default). */
    async getCheckoutSession(sessionId: string, expand?: string[]): Promise<any> {
        try {
            return await this.stripe.checkout.sessions.retrieve(sessionId, {
                expand: expand || ['subscription'],
            });
        } catch (error) {
            this.logger.error(
                `Failed to retrieve checkout session ${sessionId}: ${(error as Error).message}`,
            );
            throw error;
        }
    }

    /** After the first installment, switch later cycles to transfer only the pre-tax installment amount
     *  (exclusive GST stays with the platform for ATO remittance; at 10% GST, provider % = 100/1.1). */
    async removeTransferFeeFromSubscription(
        subscriptionId: string,
        providerStripeAccountId: string,
        amountPercent: number,
    ): Promise<void> {
        try {
            await this.stripe.subscriptions.update(subscriptionId, {
                transfer_data: {
                    destination: providerStripeAccountId,
                    amount_percent: amountPercent,
                },
            } as any);
            this.logger.log(`Subscription ${subscriptionId}: transfer_data.amount_percent set to ${amountPercent} after first cycle`);
        } catch (error) {
            this.logger.error(
                `Failed to update transfer percent for subscription ${subscriptionId}: ${(error as Error).message}`,
            );
            throw error;
        }
    }

    /** Graceful cancellation: completes the current billing cycle, then ends. */
    async cancelSubscriptionAtPeriodEnd(
        subscriptionId: string,
        reason?: string,
    ): Promise<StripeCore.Subscription> {
        try {
            return await this.stripe.subscriptions.update(subscriptionId, {
                cancel_at_period_end: true,
                metadata: reason ? { cancellation_reason: reason } : undefined,
            });
        } catch (error) {
            this.logger.error(
                `Failed to cancel subscription ${subscriptionId}: ${(error as Error).message}`,
            );
            throw error;
        }
    }

    // ─── Invoices & Credit Notes ─────────────────────────────────────────────

    /** Create a credit note against a finalized invoice. Call AFTER the refund so it reduces the invoice
     *  balance; only works when the payment used a checkout session with invoice_creation enabled. */
    async createCreditNote(
        invoiceId: string,
        amountCents: number,
        memo?: string,
        idempotencyKey?: string,
    ): Promise<StripeCore.CreditNote> {
        try {
            return await this.stripe.creditNotes.create(
                {
                    invoice: invoiceId,
                    lines: [{
                        type: 'custom_line_item',
                        unit_amount: amountCents,
                        quantity: 1,
                        description: memo || 'Service refund',
                    }],
                    memo,
                },
                // Deterministic key prevents duplicate credit notes on retries / concurrent callers.
                idempotencyKey ? { idempotencyKey } : undefined,
            );
        } catch (error) {
            this.logger.error(
                `Failed to create credit note for invoice ${invoiceId}: ${(error as Error).message}`,
            );
            throw error;
        }
    }

    /** Build and finalize the seeker's GST tax invoice, then mark it paid out-of-band — the charge
     *  already happened via PaymentIntent/Connect, which is incompatible with checkout invoice_creation,
     *  so this is a formal document, not a second charge. Two Stripe-Tax lines: the provider's portion
     *  GST-free (0%) and the Taskora fee at standard AU GST (Stripe recomputes GST from the inclusive fee
     *  line). Matches the per-cycle subscription invoices so every document looks the same. */
    async createAndFinalizeJobInvoice(
        customerId: string,
        jobId: string,
        referenceId: string,
        amounts: { serviceCents: number; feeCents: number; gstCents: number; feePercent?: number | null },
        opts: { currency?: string; jobRef?: string; jobTitle?: string; installmentNote?: string; periodStart?: number; periodEnd?: number } = {},
    ): Promise<StripeCore.Invoice> {
        const { serviceCents, feeCents, gstCents, feePercent } = amounts;
        const { currency = 'aud', jobRef = '', jobTitle = '', installmentNote = '', periodStart, periodEnd } = opts;
        try {
            const label = jobRef && jobTitle ? `${jobRef} — ${jobTitle}` : `Job #${jobId}`;
            const serviceDesc = installmentNote ? `${label} (${installmentNote})` : label;
            const grossFeeCents = feeCents + gstCents;
            const period = periodStart && periodEnd ? { start: periodStart, end: periodEnd } : undefined;

            const { jobProductId, feeProductId } = await this.getInvoiceLineProducts();

            const invoice = await this.stripe.invoices.create({
                customer: customerId,
                collection_method: 'charge_automatically',
                auto_advance: false,
                automatic_tax: { enabled: true },
                description: label,
                metadata: { jobId, referenceId, flow: installmentNote ? 'job_subscription_summary' : 'job_payment' },
            });

            // Job line — GST-free (0%), tax-inclusive. `description` overrides the generic product name.
            await this.stripe.invoiceItems.create({
                customer: customerId,
                invoice: invoice.id,
                currency,
                price_data: { currency, product: jobProductId, unit_amount: serviceCents, tax_behavior: 'inclusive' },
                description: serviceDesc,
                ...(period ? { period } : {}),
            });

            // Taskora service fee — standard AU GST, tax-inclusive; Stripe renders the GST line. Omit when zero.
            if (grossFeeCents > 0) {
                const pct = feePercent != null ? ` (${feePercent}%)` : '';
                await this.stripe.invoiceItems.create({
                    customer: customerId,
                    invoice: invoice.id,
                    currency,
                    price_data: { currency, product: feeProductId, unit_amount: grossFeeCents, tax_behavior: 'inclusive' },
                    description: `Taskora service fee${pct}`,
                    ...(period ? { period } : {}),
                });
            }

            // Finalize: draft → open, then mark paid out-of-band (payment already captured via PaymentIntent)
            await this.stripe.invoices.finalizeInvoice(invoice.id);
            const paid = await this.stripe.invoices.pay(invoice.id, { paid_out_of_band: true });

            this.logger.log(`Job invoice created: ${paid.id}, number=${paid.number}, job=${jobId}`);
            return paid;
        } catch (error) {
            this.logger.error(
                `Failed to create job invoice for job ${jobId}: ${(error as Error).message}`,
            );
            throw error;
        }
    }

    /** Lazily create (once per process) the two reusable Products the tax-invoice lines reference: a
     *  GST-free job-service product and a standard-taxed fee product. Line text is set per-item. */
    private async getInvoiceLineProducts(): Promise<{ jobProductId: string; feeProductId: string }> {
        if (!this.jobLineProductId) {
            const p = await this.stripe.products.create({
                name: 'Taskora job service',
                tax_code: 'txcd_00000000', // Non-taxable / GST-free
                metadata: { taskora_invoice_line: 'job_service' },
            });
            this.jobLineProductId = p.id;
        }
        if (!this.feeLineProductId) {
            const p = await this.stripe.products.create({
                name: 'Taskora service fee',
                metadata: { taskora_invoice_line: 'platform_fee' },
            });
            this.feeLineProductId = p.id;
        }
        return { jobProductId: this.jobLineProductId, feeProductId: this.feeLineProductId };
    }

    // ─── Refunds ─────────────────────────────────────────────────────────────

    /** Issue a refund for a charge; for Connect destination charges it also reverses the provider
     *  transfer so funds flow back correctly. */
    async createRefund(
        chargeId: string,
        amountCents: number,
        reason?: string,
        idempotencyKey?: string,
        reverseTransfer = true,
    ): Promise<StripeCore.Refund> {
        try {
            return await this.stripe.refunds.create(
                {
                    charge: chargeId,
                    amount: amountCents,
                    reason: 'requested_by_customer',
                    // Default true reverses the provider transfer proportionally; pass false when the
                    // caller already reversed it in full (e.g. a seeker cancellation).
                    reverse_transfer: reverseTransfer,
                    ...(reason ? { metadata: { reason } } : {}),
                },
                // Deterministic key collapses retries/concurrent callers to one refund per charge.
                idempotencyKey ? { idempotencyKey } : undefined,
            );
        } catch (error) {
            this.logger.error(
                `Failed to create refund for charge ${chargeId}: ${(error as Error).message}`,
            );
            throw error;
        }
    }

    /** Fully reverse a charge's destination transfer, clawing the provider payout back to the platform
     *  (used on a seeker cancellation where the provider gets nothing). Idempotent; null if no transfer. */
    async reverseChargeTransfer(
        chargeId: string,
        amountCents: number,
        idempotencyKey?: string,
    ): Promise<StripeCore.TransferReversal | null> {
        try {
            const charge = await this.stripe.charges.retrieve(chargeId);
            const transferId = typeof charge.transfer === 'string' ? charge.transfer : charge.transfer?.id;
            if (!transferId) {
                this.logger.warn(`Charge ${chargeId} has no transfer to reverse — skipping clawback`);
                return null;
            }
            return await this.stripe.transfers.createReversal(
                transferId,
                { amount: amountCents },
                idempotencyKey ? { idempotencyKey } : undefined,
            );
        } catch (error) {
            this.logger.error(
                `Failed to reverse transfer for charge ${chargeId}: ${(error as Error).message}`,
            );
            throw error;
        }
    }

    // ── Account deletion (GDPR / Play Store "delete my account") ─────────────────

    /** Best-effort deletion of a provider's Connect account on app-account deletion. Errors are logged
     *  and swallowed (Stripe blocks deletion with a balance/pending payout, but the deletion flow already
     *  guards active obligations) so a Stripe hiccup never fails the user's deletion. */
    async deleteConnectAccount(accountId: string): Promise<void> {
        try {
            await this.stripe.accounts.del(accountId);
            this.logger.log(`Deleted Stripe Connect account ${accountId}`);
        } catch (error) {
            this.logger.warn(
                `Failed to delete Stripe Connect account ${accountId}: ${(error as Error).message}`,
            );
        }
    }

    /** Best-effort deletion of a seeker's Stripe Customer (detaches saved cards) on account deletion;
     *  errors are logged and swallowed so they never block the user's deletion. */
    async deleteCustomer(customerId: string): Promise<void> {
        try {
            await this.stripe.customers.del(customerId);
            this.logger.log(`Deleted Stripe customer ${customerId}`);
        } catch (error) {
            this.logger.warn(
                `Failed to delete Stripe customer ${customerId}: ${(error as Error).message}`,
            );
        }
    }
}