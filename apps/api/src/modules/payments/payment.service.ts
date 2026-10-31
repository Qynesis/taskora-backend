import { BadRequestException, ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment } from '../../database/entities/payment.entity';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { PaymentQueryDto } from './dto/payment-query.dto';
import { PaginatedResponseDto } from '../../interfaces/paginated-response.dto';
import { paginateQuery } from '../../interfaces/paginate-query.util';
import { TransactionHelper } from '../../database/transaction.helper';
import { DomainEventEmitter } from '../../events/domain-event-emitter.service';
import { PaymentCreatedEvent } from './events/payment-created.event';
import { PaymentCompletedEvent } from './events/payment-completed.event';
import { CardAddedEvent } from './events/card-added.event';
import { ConfigService } from '@nestjs/config';
import { CreateStripeAccountDto } from './dto';
import { AuditLog, Job, JobContract, Selection, StripeAccount, StripeCustomer, User } from '../../database';
import { SubscriptionMappingRecord } from '../subscriptions/interfaces/subscription-checkout.interface';
import { getFrequencyLabel, getNumberOfPeriods, getStripeInterval } from '../subscriptions/helpers/amount.helper';
import { ConnectStatusResponseDto, PaymentDetailsResponseDto, SavedCardResponseDto } from './dto/payment-response.dto';
import { AddCardResponseDto } from './dto/add-card-response.dto';
import { GetConnectStatusDto } from './dto/payment-request.dto';
import { StripeService } from '../stripe/stripe.service';
import { PlatformFeeService } from '../platform-fee/platform-fee.service';
import { CreateSetupCheckoutData } from '../stripe/interfaces/setup-intent.interface';
import { SavedPaymentMethod } from '../../database/entities/saved-payment-method.entity';
import { JobStatus, PaymentStatus, RefundRequestStatus, RefundEvidenceSide, ServiceDuration, TransactionType, SubscriptionStatus } from '../../database/common/enum';
import { Transaction } from '../../database/entities/transaction.entity';
import { Subscription } from '../../database/entities/subscription.entity';
import { PaymentCompletedInterface } from './interfaces/payment-completed.inteface';
import { Refund } from '../../database/entities/refund.entity';
import { RefundRequest } from '../../database/entities/refund-request.entity';
import { RefundInitiatedResponseDto } from './dto/refund-response.dto';
import { money, toCents } from '../../interfaces/money.util';
import { AppCacheService } from '../../cache/cache.service';
import { jobViewPrefixes } from '../../cache/job-view-invalidation';

@Injectable()
export class PaymentService {
    private readonly logger = new Logger(PaymentService.name);

    constructor(
        private configService: ConfigService,
        private readonly txHelper: TransactionHelper,
        private readonly eventEmitter: DomainEventEmitter,
        private readonly stripeService: StripeService,
        private readonly platformFeeService: PlatformFeeService,

        @InjectRepository(Payment) private readonly paymentRepository: Repository<Payment>,
        @InjectRepository(Refund) private readonly refundRepository: Repository<Refund>,
        @InjectRepository(RefundRequest) private readonly refundRequestRepository: Repository<RefundRequest>,
        @InjectRepository(StripeAccount) private readonly stripeAccountRepository: Repository<StripeAccount>,
        @InjectRepository(User) private readonly userRepository: Repository<User>,
        @InjectRepository(StripeCustomer) private readonly stripeCustomerRepository: Repository<StripeCustomer>,
        @InjectRepository(Job) private readonly jobRepository: Repository<Job>,
        @InjectRepository(SavedPaymentMethod) private readonly savedPaymentMethodRepository: Repository<SavedPaymentMethod>,
        @InjectRepository(Selection) private readonly selectionRepository: Repository<Selection>,
        @InjectRepository(AuditLog) private readonly auditLogRepository: Repository<AuditLog>,
        @InjectRepository(JobContract) private readonly jobContractRepository: Repository<JobContract>,
        @InjectRepository(Transaction) private readonly transactionRepository: Repository<Transaction>,
        @InjectRepository(Subscription) private readonly subscriptionRepository: Repository<Subscription>,
        private readonly cacheService: AppCacheService,
    ) {}

    // Clears every seeker/provider job view for a job, used by webhook/refund flows where the
    // request-scoped @InvalidateCache interceptor can't run. Never throws — must not fail a payment.
    private async invalidateJobViews(jobId: string, seekerId: string): Promise<void> {
        try {
            await Promise.all(jobViewPrefixes(jobId, seekerId).map((p) => this.cacheService.delByPrefix(p)));
        } catch (err) {
            this.logger.error(`Failed to invalidate job views for job ${jobId}: ${(err as Error).message}`);
        }
    }

    async findOne(id: string): Promise<any> {
        void id;
        return { message: 'Not implemented yet' };
    }

    // ---------------------------STRIPE CONNECT---------------------------

    async getProviderPayments(providerUserId: string, query: PaymentQueryDto): Promise<PaginatedResponseDto<any>> {
        const qb = this.paymentRepository
            .createQueryBuilder('p')
            .leftJoinAndSelect('p.job', 'job')
            .leftJoinAndSelect('p.seeker', 'seeker')
            .leftJoinAndSelect('seeker.profile', 'seekerProfile')
            .where('p.provider_user_id = :providerUserId', { providerUserId })
            .andWhere(
                `(p.status <> :canceledStatus OR EXISTS (
                    SELECT 1 FROM transactions t WHERE t.payment_id = p.id AND t.type = :paymentTxnType
                ))`,
                { canceledStatus: PaymentStatus.CANCELED, paymentTxnType: TransactionType.PAYMENT },
            );

        if (query.status) {
            const dbStatus = query.status === 'paid' ? PaymentStatus.SUCCEEDED : query.status;
            qb.andWhere('p.status = :status', { status: dbStatus });
        }
        qb.orderBy('p.createdAt', 'DESC')
            .skip((query.page - 1) * query.limit)
            .take(query.limit);

        const [payments, total] = await qb.getManyAndCount();

        // Provider's actual earnings come from the transaction ledger (one row per money
        // movement), not the contract-level Payment row. Sum provider_payout per payment.
        const payoutByPaymentId = new Map<string, number>();
        const paymentIds = payments.map((p) => p.id);
        if (paymentIds.length > 0) {
            const payoutRows = await this.transactionRepository
                .createQueryBuilder('t')
                .select('t.payment_id', 'paymentId')
                .addSelect('COALESCE(SUM(t.provider_payout), 0)::float', 'payout')
                .where('t.payment_id IN (:...paymentIds)', { paymentIds })
                .andWhere('t.type = :type', { type: TransactionType.PAYMENT })
                .groupBy('t.payment_id')
                .getRawMany<{ paymentId: string; payout: string }>();
            for (const row of payoutRows) {
                payoutByPaymentId.set(row.paymentId, Number(row.payout));
            }
        }

        const refundIdByPaymentId = new Map<string, string>();
        const refundedIds = payments.filter((p) => p.status === PaymentStatus.REFUNDED).map((p) => p.id);
        if (refundedIds.length > 0) {
            const rows = await this.paymentRepository.manager
                .createQueryBuilder()
                .select('r.payment_id', 'paymentId')
                .addSelect('r.id', 'refundId')
                .from('refunds', 'r')
                .where('r.payment_id IN (:...refundedIds)', { refundedIds })
                .orderBy('r.created_at', 'DESC')
                .getRawMany<{ paymentId: string; refundId: string }>();

            for (const row of rows) {
                if (!refundIdByPaymentId.has(row.paymentId)) {
                    refundIdByPaymentId.set(row.paymentId, row.refundId);
                }
            }
        }

        return new PaginatedResponseDto(
            payments.map((p) => {
                const profile = (p as any).seeker?.profile;
                const fullName = [profile?.firstName, profile?.lastName].filter(Boolean).join(' ');
                return {
                    id: p.id,
                    jobId: (p as any).job?.id ?? null,
                    jobTitle: (p as any).job?.title ?? null,
                    clientName: fullName || (p as any).seeker?.email || '',
                    amount: payoutByPaymentId.get(p.id) ?? 0,
                    currency: p.currency,
                    status: p.status === 'succeeded' ? 'paid' : p.status,
                    invoiceUrl: p.status === PaymentStatus.SUCCEEDED ? (p.hostedInvoiceUrl ?? null) : null,
                    refundId: p.status === PaymentStatus.REFUNDED ? (refundIdByPaymentId.get(p.id) ?? null) : null,
                    createdAt: p.createdAt,
                };
            }),
            total,
            query.page,
            query.limit,
        );
    }

    async getProviderEarningsSummary(providerUserId: string): Promise<{ totalEarnings: number; totalPending: number; totalRefunded: number; currency: string }> {
        // totalEarnings: SUM(provider_payout) over the provider's Transaction rows (one per actual Stripe
        // money movement), so it reflects what was genuinely transferred regardless of Payment status.
        const earningsRow = await this.transactionRepository
            .createQueryBuilder('t')
            .select('COALESCE(SUM(t.provider_payout), 0)::float', 'totalEarnings')
            .innerJoin('t.payment', 'p')
            .where('p.provider_user_id = :providerUserId', { providerUserId })
            .andWhere('t.type = :type', { type: TransactionType.PAYMENT })
            .getRawOne<{ totalEarnings: string }>();

        // totalPending: across PENDING contracts, the provider's contracted share (provider_amount)
        // minus what's already been paid out (SUM of provider_payout), floored at 0.
        const pendingRows = await this.paymentRepository.manager.query<Array<{ totalPending: string }>>(
            `SELECT COALESCE(SUM(GREATEST(p.provider_amount - COALESCE(t.earned, 0), 0)), 0)::float AS "totalPending"
             FROM service.payments p
             LEFT JOIN (
               SELECT payment_id, SUM(provider_payout) AS earned
               FROM service.transactions
               WHERE type = 'payment'
               GROUP BY payment_id
             ) t ON t.payment_id = p.id
             WHERE p.provider_user_id = $1
               AND p.status = 'pending'`,
            [providerUserId],
        );
        const totalPending = Number(pendingRows[0]?.totalPending ?? 0);

        // totalRefunded: sum of refund amounts linked to this provider's payments.
        const refundedRow = await this.paymentRepository
            .createQueryBuilder('p')
            .select('COALESCE(SUM(r.amount), 0)::float', 'totalRefunded')
            .innerJoin('p.refunds', 'r')
            .where('p.provider_user_id = :providerUserId', { providerUserId })
            .getRawOne<{ totalRefunded: string }>();

        return {
            totalEarnings: money(earningsRow?.totalEarnings ?? 0),
            totalPending: money(totalPending),
            totalRefunded: money(refundedRow?.totalRefunded ?? 0),
            currency: 'AUD',
        };
    }

    // Get stripe connect account status
    async getConnectStatus(dto: GetConnectStatusDto): Promise<ConnectStatusResponseDto>{

        const {id} = dto;

        // find stripe account connected with user
        const stripeAccount = await this.stripeAccountRepository.findOne({
            where: {provider: {id}}
        });
        if(!stripeAccount) throw new BadRequestException('Stripe Connect account not found. Please start onboarding first.');

        // fetch account status from stripe
        const account = await this.stripeService.retrieveConnectedAccount(stripeAccount.accountId);

        const response: ConnectStatusResponseDto = {
            accountId: account.id,
            detailsSubmitted: account.details_submitted,
            chargesEnabled: account.charges_enabled,
            payoutsEnabled: account.payouts_enabled,
            currentlyDue: account.requirements?.currently_due || [],
            eventuallyDue: account.requirements?.eventually_due || []
        };

        return response;
    }

    // get payment details by ID
    async getPaymentDetails(
        paymentIntentId: string,
        requesterId: string,
        requesterRoles: string[],
    ): Promise<PaymentDetailsResponseDto>{
        const isAdmin = requesterRoles.some((role) => role.toUpperCase() === 'ADMIN');

        if (!isAdmin) {
            const txn = await this.transactionRepository.findOne({
                where: { stripePaymentIntentId: paymentIntentId },
                relations: ['payment', 'payment.seeker', 'payment.provider'],
            });
            const hasAccess = txn?.payment
                ? (txn.payment.seeker?.id === requesterId || (txn.payment.provider as any)?.id === requesterId)
                : false;

            if (!hasAccess) {
                throw new NotFoundException('Payment details not found');
            }
        }

        const paymentDetails: PaymentDetailsResponseDto = await this.stripeService.getPaymentDetails(paymentIntentId);
        if(!paymentDetails){
            throw new NotFoundException('Payment details not found');
        }

        return paymentDetails;
    }

    // get saved cards
    async getSavedCards(id: string): Promise<SavedCardResponseDto[]>{

        const savedCards=await this.savedPaymentMethodRepository.find({
            where:{seeker:{id}},
            order:{
                isDefault:'DESC',
                createdAt: 'DESC'
            }
        });

        const response: SavedCardResponseDto[] = savedCards
            .filter(card => card.brand && card.last4 && card.expMonth && card.expYear)
            .map((card) => ({
                card_id: card.id,
                card_brand: card.brand!,
                last4: card.last4!,
                expires: `${card.expMonth}/${card.expYear}`,
                is_default_card: card.isDefault
            }));

        return response;
    }

    // set a card default or unset it
    async setDefaultCard(userId: string, id: string, isDefault: boolean): Promise<boolean> {
        const targetedCard = await this.savedPaymentMethodRepository.findOne({
            where: {
                seeker: { id: userId },
                id
            }
        });

        if (!targetedCard) {
            throw new BadRequestException(`Card not found`);
        }

        let response: boolean = false;

        await this.txHelper.run(async (qr) => {
            if (isDefault) {
                // If setting as default, unset all other default cards
                await this.savedPaymentMethodRepository.update(
                    { seeker: { id: userId }, isDefault: true },
                    { isDefault: false }
                );

                // Set this card as default in database
                targetedCard.isDefault = true;
                await this.savedPaymentMethodRepository.save(targetedCard);
            } else {
                // If unsetting as default, just update the card
                targetedCard.isDefault = false;
                await this.savedPaymentMethodRepository.save(targetedCard);
            }

            response = true;
        });

        return response;
    }

    // Remove a saved card from both Stripe and database
    async removeCard(userId: string, id: string): Promise<null> {
        const targetedCard = await this.savedPaymentMethodRepository.findOne({
            where: {
                seeker: { id: userId },
                id
            }
        });

        if (!targetedCard) {
            throw new BadRequestException('Card not found');
        }

        const activeSubscription = await this.subscriptionRepository.findOne({
            where: [
                { seeker: { id: userId }, status: SubscriptionStatus.ACTIVE },
                { seeker: { id: userId }, status: SubscriptionStatus.TRIALING },
            ],
        });
        if (activeSubscription) {
            throw new BadRequestException(
                'Cannot remove card while you have an active subscription. Please cancel the subscription first.',
            );
        }

        await this.txHelper.run(async (qr) => {
            // Remove from Stripe first
            await this.stripeService.detachPaymentMethod(targetedCard.stripePaymentMethodId);

            // Delete from database
            await qr.manager.delete(SavedPaymentMethod, targetedCard.id);
        });

        this.logger.log(`Card ${targetedCard.stripePaymentMethodId} removed for user ${userId}`);
        return null;
    }

    // Add a new card — creates a Stripe Checkout Session and returns the hosted URL
    async addCard(userId: string, successUrl: string, cancelUrl: string): Promise<AddCardResponseDto> {
        const user = await this.userRepository.findOne({
            where: { id: userId },
            relations: ['stripeCustomer'],
        });

        if (!user) {
            throw new NotFoundException(`User with id "${userId}" not found`);
        }

        // Auto-provision the Stripe customer on first card add — the seeker has no reason to have
        // one before their first payment/card. Mirrors the lazy creation in the checkout flow.
        let stripeCustomer = user.stripeCustomer;
        if (!stripeCustomer) {
            const stripeCustomerObj = await this.stripeService.create(user.email, user.email, userId);
            stripeCustomer = this.stripeCustomerRepository.create({
                seeker: { id: userId },
                customerId: stripeCustomerObj.id,
            });
            await this.txHelper.run(async (qr) => { await qr.manager.save(stripeCustomer); });
            this.logger.log(`Created Stripe customer for seeker ${userId}: ${stripeCustomerObj.id}`);
        }

        // Stripe substitutes {CHECKOUT_SESSION_ID} with the real session ID on redirect,
        // allowing the frontend to call /cards/verify-add?session_id=cs_xxx afterwards.
        const successUrlWithSession = successUrl.includes('?')
            ? `${successUrl}&session_id={CHECKOUT_SESSION_ID}`
            : `${successUrl}?session_id={CHECKOUT_SESSION_ID}`;

        const checkoutData: CreateSetupCheckoutData = {
            customerId: stripeCustomer.customerId,
            userId,
            successUrl: successUrlWithSession,
            cancelUrl,
        };

        const { checkoutUrl, sessionId } = await this.stripeService.createSetupCheckoutSession(checkoutData);

        this.logger.log(`Card addition initiated: userId="${userId}", sessionId="${sessionId}"`);

        return { checkout_url: checkoutUrl, session_id: sessionId };
    }

    /**
     * Called by the frontend after Stripe redirects to the success URL.
     * Returns whether the card was newly saved, already on file (duplicate), or
     * the webhook hasn't fired yet (pending — client should retry briefly).
     */
    async verifyCardAdd(userId: string, sessionId: string): Promise<{ status: 'saved' | 'duplicate' | 'pending' }> {
        const session = await this.stripeService.retrieveCheckoutSession(sessionId);

        if (session.mode !== 'setup') {
            throw new BadRequestException('Invalid session type');
        }

        // Security: session must belong to this user's Stripe customer
        const stripeCustomer = await this.stripeCustomerRepository.findOne({
            where: { seeker: { id: userId } },
        });
        if (!stripeCustomer || session.customer !== stripeCustomer.customerId) {
            throw new ForbiddenException('Session does not belong to this user');
        }

        const setupIntent = session.setup_intent as any;
        if (!setupIntent?.payment_method) return { status: 'pending' };

        const pm = setupIntent.payment_method;
        const paymentMethodId: string = typeof pm === 'string' ? pm : pm.id;

        // Webhook already fired and saved this exact PM → new card
        const savedWithThisPm = await this.savedPaymentMethodRepository.findOne({
            where: { seeker: { id: userId }, stripePaymentMethodId: paymentMethodId },
        });
        if (savedWithThisPm) return { status: 'saved' };

        // Check by fingerprint — same physical card already on file
        const details = await this.stripeService.getPaymentMethodDetails(paymentMethodId);
        if (details?.fingerprint) {
            const duplicate = await this.savedPaymentMethodRepository.findOne({
                where: { seeker: { id: userId }, fingerprint: details.fingerprint },
            });
            if (duplicate) return { status: 'duplicate' };
        }

        // Webhook hasn't processed yet — client should retry in ~1s (up to ~5 times)
        return { status: 'pending' };
    }

    // ── Unified Job Checkout ─────────────────────────────────────────────────

    async initiateJobCheckout(jobId: string, seekerId: string): Promise<{ url: string; sessionId: string; checkoutType: 'one_time' | 'subscription' }> {
        const job = await this.jobRepository.findOne({
            where: { id: jobId },
            relations: ['seeker', 'selectedBid', 'provider'],
        });

        if (!job) throw new NotFoundException(`Job ${jobId} not found`);
        if (job.seeker.id !== seekerId) throw new BadRequestException('Job does not belong to this seeker');
        const NON_PAYABLE_STATUSES = [JobStatus.CANCELLED, JobStatus.COMPLETED, JobStatus.REJECTED];
        if (NON_PAYABLE_STATUSES.includes(job.status)) {
            throw new BadRequestException(`Job cannot be paid for in its current status: "${job.status}"`);
        }
        if (!job.selectedBid) throw new BadRequestException('No bid has been selected for this job yet');
        if (!job.provider) throw new BadRequestException('No provider has been selected for this job yet');

        const totalAmount = money(job.selectedBid.price);
        if (!totalAmount || totalAmount <= 0) throw new BadRequestException(`Invalid bid amount: ${job.selectedBid.price}`);

        const providerStripeAccount = await this.stripeAccountRepository.findOne({
            where: { provider: { id: job.provider.id } },
        });
        if (!providerStripeAccount?.accountId) {
            throw new BadRequestException('Provider does not have a valid Stripe account configured');
        }

        // The bid gate only proves the provider was verified when they bid; Stripe verifies
        // asynchronously and can restrict an account afterwards. Re-verify live at the money-out
        // moment so a seeker never pays into an account that can't actually receive the funds.
        await this.stripeService.assertProviderPayoutEnabled(job.provider.id);

        let stripeCustomer = await this.stripeCustomerRepository.findOne({
            where: { seeker: { id: seekerId } },
        });
        if (!stripeCustomer) {
            const seekerEmail = job.seeker.email;
            const stripeCustomerObj = await this.stripeService.create(seekerEmail, seekerEmail, seekerId);
            stripeCustomer = this.stripeCustomerRepository.create({
                seeker: { id: seekerId },
                customerId: stripeCustomerObj.id,
            });
            await this.txHelper.run(async (qr) => { await qr.manager.save(stripeCustomer); });
            this.logger.log(`Created Stripe customer for seeker ${seekerId}: ${stripeCustomerObj.id}`);
        }

        const successUrl = process.env['STRIPE_CHECKOUT_SUCCESS_URL'] || 'http://localhost:3000/checkout/success';
        const cancelUrl = process.env['STRIPE_CHECKOUT_CANCEL_URL'] || 'http://localhost:3000/checkout/cancel';

        if (job.serviceDuration === ServiceDuration.SINGLE_TASK) {
            const result = await this.initiateOneTimeCheckout(
                job, stripeCustomer.customerId, providerStripeAccount.accountId, totalAmount, seekerId, successUrl, cancelUrl,
            );
            return { ...result, checkoutType: 'one_time' };
        }

        return this.initiateSubscriptionCheckout(
            job, stripeCustomer.customerId, providerStripeAccount.accountId, seekerId, successUrl, cancelUrl,
        );
    }

    private async initiateOneTimeCheckout(
        job: Job,
        stripeCustomerId: string,
        providerStripeAccountId: string,
        totalAmount: number,
        seekerId: string,
        successUrl: string,
        cancelUrl: string,
    ): Promise<{ url: string; sessionId: string }> {
        const { platformCharge } = await this.platformFeeService.getCharge();
        // New model: the GST-inclusive service fee is added ON TOP of the job price. The seeker pays
        // jobPrice + fee; the provider receives the full job price; the fee (GST inside) is the platform's.
        const serviceFee = money(totalAmount * (platformCharge / 100));
        const jobPriceCents = toCents(totalAmount);
        const serviceFeeCents = toCents(serviceFee);

        const result = await this.stripeService.createPaymentCheckoutSession(
            stripeCustomerId,
            jobPriceCents,
            serviceFeeCents,
            job.id,
            seekerId,
            job.provider!.id,
            providerStripeAccountId,
            successUrl,
            cancelUrl,
            job.jobRef,
            job.title ?? 'Service Job',
            platformCharge,
        );

        this.logger.log(`One-time checkout created for job ${job.id}: ${result.sessionId}, jobPrice=${jobPriceCents}c, fee=${serviceFeeCents}c`);
        return result;
    }

    private async initiateSubscriptionCheckout(
        job: Job,
        stripeCustomerId: string,
        providerStripeAccountId: string,
        seekerId: string,
        successUrl: string,
        cancelUrl: string,
    ): Promise<{ url: string; sessionId: string; checkoutType: 'subscription' }> {
        if (!job.durationMonths) {
            throw new BadRequestException('Job does not have a subscription duration configured');
        }

        const contract = await this.jobContractRepository.findOne({
            where: { job: { id: job.id } },
        });
        if (!contract) {
            throw new BadRequestException('Job contract not found. A contract must be created before initiating payment.');
        }

        const selection = await this.selectionRepository.findOne({
            where: { job: { id: job.id } },
        });
        if (!selection) throw new BadRequestException('Selection not found for this job');

        const totalAmount = money(job.selectedBid!.price);
        const numberOfPeriods = getNumberOfPeriods(contract.paymentFrequency, job.durationMonths);
        const stripeInterval = getStripeInterval(contract.paymentFrequency);

        const installmentAmount = money(totalAmount / numberOfPeriods);
        const installmentAmountCents = toCents(installmentAmount);

        const { platformCharge } = await this.platformFeeService.getCharge();
        // New model: the GST-inclusive service fee is added on top of each installment. The provider
        // receives the full installment every cycle; the fee (GST inside) is the platform's, every cycle.
        const serviceFeePerCycle = money(installmentAmount * (platformCharge / 100));
        const chargedPerCycle = money(installmentAmount + serviceFeePerCycle);
        const providerPercent = parseFloat(((installmentAmount / chargedPerCycle) * 100).toFixed(2));

        const checkoutSession = await this.stripeService.createSubscriptionCheckoutSession(
            stripeCustomerId,
            installmentAmountCents,
            toCents(serviceFeePerCycle),
            stripeInterval,
            numberOfPeriods,
            selection.id,
            job.id,
            seekerId,
            job.provider!.id,
            providerStripeAccountId,
            successUrl,
            cancelUrl,
            providerPercent,
            job.jobRef,
            job.title ?? 'Service Job',
            getFrequencyLabel(contract.paymentFrequency),
            platformCharge,
        );

        const mappingRecord: SubscriptionMappingRecord = {
            selectionId: selection.id,
            subscriptionId: '',
            checkoutSessionId: checkoutSession.sessionId,
            stripeCustomerId,
            durationMonths: job.durationMonths,
            numberOfPeriods,
            monthlyAmount: totalAmount,
            installmentAmount,
            totalAmount,
            currency: (job as any).currency || 'AUD',
            providerStripeAccountId,
            seekerId,
            providerId: job.provider!.id,
            jobId: job.id,
            paymentFrequency: contract.paymentFrequency,
        };

        await this.txHelper.run(async (qr) => {
            await qr.manager.save(AuditLog, {
                action: 'STRIPE_CHECKOUT_SESSION_CREATED',
                entityType: 'job',
                entityId: job.id,
                actor: { id: seekerId },
                metadata: mappingRecord,
            });
        });

        this.logger.log(`Subscription checkout created for job ${job.id}: ${checkoutSession.sessionId}, installment=${installmentAmountCents}c`);
        return { ...checkoutSession, checkoutType: 'subscription' };
    }

    // ────────────────────────────────────────────────────────────────────────

    /** Emit CardAddedEvent (from the webhook controller on setup_intent.succeeded). */
    async emitCardAdded(event: CardAddedEvent): Promise<void> {
        this.eventEmitter.emit(event);
    }

    /** Emit PaymentCompletedEvent (from the webhook controller on payment_intent.succeeded). */
    async emitPaymentCompleted(event: PaymentCompletedEvent): Promise<void> {
        this.eventEmitter.emit(event);
    }

    /** Update payment status after a successful payment; creates the Payment row if missing.
     *  Called by PaymentEventListener on PaymentCompletedEvent. */
    async onPaymentCompleted(params: PaymentCompletedInterface): Promise<void> {
        try {
            if (!params.jobId) {
                this.logger.warn(`Payment completed event missing jobId — skipping`);
                return;
            }

            const job = await this.jobRepository.findOne({
                where: { id: params.jobId },
                relations: ['seeker', 'provider'],
            });

            if (!job) {
                this.logger.warn(`Job not found: ${params.jobId}`);
                return;
            }

            const seeker = job.seeker;
            const provider = job.provider;

            if (!seeker) {
                this.logger.warn(`Job ${params.jobId} has no seeker`);
                return;
            }

            if (!provider) {
                this.logger.warn(`Job ${params.jobId} has no provider`);
                return;
            }

            // Idempotency: if a Transaction already exists for this intent, the webhook was already processed.
            if (params.paymentIntentId) {
                const existingTxn = await this.transactionRepository.findOne({
                    where: { stripePaymentIntentId: params.paymentIntentId },
                });
                if (existingTxn) {
                    this.logger.warn(`payment_intent ${params.paymentIntentId} already processed (txn ${existingTxn.id}) — skipping`);
                    return;
                }
            }

            let payment = await this.paymentRepository.findOne({
                where: { job: { id: job.id }, status: PaymentStatus.PENDING },
                order: { createdAt: 'DESC' },
            }) ?? null;

            if (!payment && job) {
                payment = await this.paymentRepository.findOne({
                    where: { job: { id: job.id }, status: PaymentStatus.PENDING },
                    order: { createdAt: 'DESC' },
                }) ?? null;
            }

            const feeSplit = await this.platformFeeService.splitAmount(params.amount);
            const feeConfigRef = feeSplit.configId ? { id: feeSplit.configId } : null;

            // Fee / GST / payout are recorded on the Transaction row below (per money movement),
            // not on the contract-level Payment. The Payment only tracks the charged amount +
            // status + which fee config governed it.
            if (payment) {
                // amount stays the job price set at selection (bid.price). The charged total
                // (job price + GST) and the fee/payout/GST split live on the Transaction row.
                payment.status = PaymentStatus.SUCCEEDED;
                payment.method = 'stripe';
                payment.hostedInvoiceUrl = params.hostedInvoiceUrl ?? null;
                if (feeConfigRef) (payment as any).feeConfig = feeConfigRef;
            } else {
                // Fallback (no selection-time payment). New model: the job price is what the provider
                // receives (the fee is added on top of it), so Payment.amount = providerAmount.
                payment = this.paymentRepository.create({
                    amount: params.providerAmount,
                    platformFee: params.platformFee,
                    providerAmount: params.providerAmount,
                    currency: 'AUD',
                    status: PaymentStatus.SUCCEEDED,
                    method: 'stripe',
                    hostedInvoiceUrl: params.hostedInvoiceUrl ?? null,
                    feeConfig: feeConfigRef,
                    job,
                    seeker,
                    provider,
                });
            }

            await this.paymentRepository.save(payment);

            await this.transactionRepository.save(
                this.transactionRepository.create({
                    txnRef: `PAY-${params.paymentIntentId}`,
                    type: TransactionType.PAYMENT,
                    sender: seeker,
                    payment,
                    amount: params.amount,
                    currency: 'AUD',
                    stripeInvoiceId: params.invoiceId ?? null,
                    stripeSubscriptionId: null,
                    stripePaymentIntentId: params.paymentIntentId ?? null,
                    stripeChargeId: params.chargeId ?? null,
                    platformFee: params.platformFee,
                    providerPayout: params.providerAmount,
                    taxGstAmmount: params.taxGstAmmount,
                    invoiceNumber: params.invoiceNumber ?? null,
                    hostedInvoiceUrl: params.hostedInvoiceUrl ?? null,
                    description: `One-time payment${job.jobRef ? ` — ${job.jobRef}` : ''}${job.title ? ` · ${job.title}` : ''}`,
                }),
            );

            this.eventEmitter.emit(
                new PaymentCreatedEvent(payment.id, seeker.id, provider.id, Number(params.amount), Number(params.providerAmount), job?.title ?? null),
            );

            this.logger.log(
                `Payment ${payment.id} updated to SUCCEEDED (intent: ${params.paymentIntentId}, amount: ${params.amount}, providerAmount: ${params.providerAmount})`
            );

            // Payment success flips the job's paymentStatus/status for both parties and moves it
            // between their lists — clear every job view so neither sees stale "unpaid" data.
            await this.invalidateJobViews(job.id, seeker.id);
        } catch (error) {
            this.logger.error(
                `Failed to process payment for intent ${params.paymentIntentId}: ${(error as Error).message}`
            );
            throw error;
        }
    }
    /** Process a provider-initiated refund: verify ownership, issue the Stripe refund per charge (reversing
     *  the provider transfer), then atomically mark Payment REFUNDED, create the Refund row, and approve
     *  the RefundRequest. */
    async processRefund(paymentId: string, providerId: string): Promise<RefundInitiatedResponseDto> {
        const payment = await this.paymentRepository.findOne({
            where: { id: paymentId },
            relations: { job: { provider: true }, seeker: true },
        });

        if (!payment) {
            throw new NotFoundException(`Payment with id "${paymentId}" not found`);
        }

        const jobProviderId =
            payment.job?.provider?.id ?? null;
        if (jobProviderId !== providerId) {
            throw new ForbiddenException('You do not have access to this payment');
        }

        // Guard: already refunded (e.g. via cancel flow)
        if (payment.status === PaymentStatus.REFUNDED) {
            throw new BadRequestException('Payment has already been refunded');
        }

        // Single-task: Stripe collected in one shot, payment must be SUCCEEDED.
        // Subscription: payment stays PENDING across cycles; transactions hold actual charges.
        if (!payment.isSubscription && payment.status !== PaymentStatus.SUCCEEDED) {
            throw new BadRequestException(
                `Payment cannot be refunded: current status is "${payment.status}"`,
            );
        }

        // Get per-cycle transactions to retrieve Stripe charge IDs.
        // Single-task: one transaction / one charge.
        // Subscription: N transactions, one per billing cycle.
        const paymentTransactions = await this.transactionRepository.find({
            where: { payment: { id: paymentId }, type: TransactionType.PAYMENT },
            order: { createdAt: 'ASC' },
        });

        if (payment.isSubscription && paymentTransactions.length === 0) {
            throw new BadRequestException('No payment cycles have been collected yet for this subscription');
        }

        const chargeableTransactions = paymentTransactions.filter((t) => !!t.stripeChargeId);
        if (!chargeableTransactions.length) {
            throw new BadRequestException('Payment does not have any associated Stripe charges');
        }

        const refundRequest = await this.refundRequestRepository.findOne({
            where: { payment: { id: paymentId }, status: RefundRequestStatus.PENDING } as any,
            order: { createdAt: 'DESC' },
        });

        if (!refundRequest) {
            throw new NotFoundException('No pending refund request found for this payment');
        }

        // Issue a Stripe refund per charge, tracking the invoice ID per result
        // so we can create a matching credit note per invoice.
        const stripeRefunds: Array<{
            id: string; amount: number; status: string;
            chargeId: string; invoiceId: string | null;
        }> = [];

        // Percentage admin fee retained from the refund (config-driven). The 11.99% service fee is
        // non-refundable, so refunds are computed on the job-price portion only.
        const feeConfig = await this.platformFeeService.getActiveConfig();
        const adminFeePercent = money(feeConfig?.cancellationFeePercent ?? 10);

        if (!payment.isSubscription) {
            // Single-task: requestedAmount is already the job price (excludes the service fee).
            // Refund job price − admin fee (a percentage of the price). Deterministic key makes retries safe.
            const txn = chargeableTransactions[0] as (typeof chargeableTransactions)[0];
            const chargeId = txn.stripeChargeId as string;
            const adminFee = money(refundRequest.requestedAmount * (adminFeePercent / 100));
            const refundBase = money(Math.max(0, refundRequest.requestedAmount - adminFee));
            const sr = await this.stripeService.createRefund(
                chargeId,
                toCents(refundBase),
                refundRequest.reason,
                `refund:${refundRequest.id}:${chargeId}`,
            );
            stripeRefunds.push({
                id: sr.id, amount: sr.amount, status: sr.status ?? 'succeeded',
                chargeId, invoiceId: txn.stripeInvoiceId ?? null,
            });
        } else {
            // Subscription: refund the provider-payout (job-price) portion of each cycle — the
            // service fee stays with the platform. The admin fee is a percentage, applied to each
            // cycle (so it totals the same % of the whole refund). Keying each refund by
            // (request, charge) keeps partial-failure retries safe.
            for (const txn of chargeableTransactions) {
                const chargeId = txn.stripeChargeId as string;
                const cyclePayout = money(txn.providerPayout ?? 0);
                const cycleFee = money(cyclePayout * (adminFeePercent / 100));
                const cycleBase = money(Math.max(0, cyclePayout - cycleFee));
                const sr = await this.stripeService.createRefund(
                    chargeId,
                    toCents(cycleBase),
                    refundRequest.reason,
                    `refund:${refundRequest.id}:${chargeId}`,
                );
                stripeRefunds.push({
                    id: sr.id, amount: sr.amount, status: sr.status ?? 'succeeded',
                    chargeId, invoiceId: txn.stripeInvoiceId ?? null,
                });
            }
        }

        const totalRefundedCents = stripeRefunds.reduce((sum, r) => sum + r.amount, 0);
        const totalRefundedDollars = totalRefundedCents / 100;
        const firstRefund = stripeRefunds[0] as (typeof stripeRefunds)[0];

        // Create one credit note per invoice (non-fatal).
        // Single-task: one invoice → one credit note.
        // Subscription: one credit note per billing cycle's invoice.
        // Uses the Stripe-confirmed refund amount (cents) per entry — not the contract commitment.
        const creditNoteMap = new Map<number, { id: string; pdfUrl: string | null }>();
        for (let i = 0; i < stripeRefunds.length; i++) {
            const sr = stripeRefunds[i] as (typeof stripeRefunds)[0];
            if (!sr.invoiceId) continue;
            try {
                const cn = await this.stripeService.createCreditNote(
                    sr.invoiceId,
                    sr.amount, // already in cents (Stripe-confirmed amount)
                    refundRequest.reason ?? 'Service refund',
                    `cn:${refundRequest.id}:${sr.invoiceId}`,
                );
                creditNoteMap.set(i, { id: cn.id, pdfUrl: (cn as any).pdf ?? null });
            } catch (err) {
                this.logger.warn(
                    `Credit note skipped for payment ${paymentId} refund[${i}]: ${(err as Error).message}`,
                );
            }
        }

        await this.txHelper.run(async (qr) => {
            await qr.manager.update(Payment, paymentId, { status: PaymentStatus.REFUNDED });

            for (let i = 0; i < stripeRefunds.length; i++) {
                const sr = stripeRefunds[i] as (typeof stripeRefunds)[0];
                const cn = creditNoteMap.get(i) ?? null;
                await qr.manager.save(Refund, {
                    payment: { id: paymentId },
                    stripeRefundId: sr.id,
                    stripeChargeId: sr.chargeId,
                    amount: sr.amount / 100,
                    reason: refundRequest.reason,
                    status: sr.status,
                    stripeCreditNoteId: cn?.id ?? null,
                    creditNotePdfUrl: cn?.pdfUrl ?? null,
                });
            }

            await qr.manager.update(RefundRequest, refundRequest.id, {
                status: RefundRequestStatus.APPROVED,
                reviewedAt: new Date(),
                stripeRefundId: firstRefund.id,
            });
        });

        this.logger.log(
            `Refund processed: paymentId=${paymentId}, charges=${stripeRefunds.map((r) => r.id).join(',')}, total=${totalRefundedCents}c`,
        );

        // Payment is now REFUNDED — clear both parties' job views so the new status shows at once.
        if (payment.job?.id && (payment.seeker as any)?.id) {
            await this.invalidateJobViews(payment.job.id, (payment.seeker as any).id);
        }

        // reverse_transfer claws the provider's share back out of their connected account. If they were
        // already paid out, that reversal drives the account negative — the seeker refund still succeeds,
        // but the platform is now exposed until Stripe recovers it from the provider's future charges.
        // Best-effort alert only: never fail the refund over a balance-check hiccup.
        void this.warnIfConnectedAccountNegative(providerId, paymentId);

        return {
            stripeRefundId: firstRefund.id,
            amount: totalRefundedDollars,
            status: firstRefund.status,
        };
    }

    /** Best-effort: log a warning if a refund's transfer reversal left the provider's connected account negative. */
    private async warnIfConnectedAccountNegative(providerId: string, paymentId: string): Promise<void> {
        try {
            const account = await this.stripeAccountRepository.findOne({
                where: { provider: { id: providerId } },
            });
            if (!account?.accountId) return;

            const balance = await this.stripeService.retrieveConnectedBalance(account.accountId);
            const negative = [...(balance.available ?? []), ...(balance.pending ?? [])].filter((b) => b.amount < 0);
            if (negative.length) {
                const detail = negative.map((b) => `${b.amount}c ${b.currency}`).join(', ');
                this.logger.warn(
                    `Connected account ${account.accountId} is NEGATIVE after refund reversal ` +
                    `(paymentId=${paymentId}, provider=${providerId}): ${detail}. ` +
                    `Seeker refund succeeded; platform exposed until Stripe recovers from the provider's future charges.`,
                );
            }
        } catch (err) {
            this.logger.warn(
                `Post-refund balance check skipped for provider ${providerId} (paymentId=${paymentId}): ${(err as Error).message}`,
            );
        }
    }

    /** Sync a refund's status from Stripe (charge.refunded webhook); handles async refunds
     *  (e.g. bank transfers that take days to settle). */
    async syncRefundStatus(stripeRefundId: string, status: string): Promise<void> {
        const refund = await this.refundRepository.findOne({
            where: { stripeRefundId },
            relations: { payment: { job: true, seeker: true } },
        });
        if (!refund) {
            this.logger.debug(`charge.refunded: no local Refund record for ${stripeRefundId}`);
            return;
        }
        if (refund.status === status) return;

        refund.status = status;
        await this.refundRepository.save(refund);
        this.logger.log(`Refund ${stripeRefundId} status synced to "${status}"`);

        // A finalised refund flips the job's payment/refund state for both parties.
        const jobId = refund.payment?.job?.id;
        const seekerId = (refund.payment?.seeker as any)?.id;
        if (jobId && seekerId) {
            await this.invalidateJobViews(jobId, seekerId);
        }
    }


}
