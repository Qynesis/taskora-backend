import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { StripeService } from './stripe.service';
import { STRIPE_CLIENT } from './stripe.constant';
import { IndividualOnboardingData, MakePaymentIntent } from './interfaces/stripe-process.interface';
import { getRepositoryToken } from '@nestjs/typeorm';
import { StripeAccount } from '../../database/entities/stripe-account.entity';
import { TransactionHelper } from '../../database/transaction.helper';
import { AzureStorageService } from '../../storage/storage.service';
import { DomainEventEmitter } from '../../events/domain-event-emitter.service';
import { AppCacheService } from '../../cache/cache.service';
import { createMockRepository, createMockEventEmitter } from '../../../test/helpers/test-factory';

const USER_ID = '00000000-0000-0000-0000-000000000001';
const PROVIDER_ID = '00000000-0000-0000-0000-000000000002';
const ACCOUNT_ID = 'acct_test123';
const CUSTOMER_ID = 'cus_test123';
const PRICE_ID = 'price_test123';
const SUBSCRIPTION_ID = 'sub_test123';
const PAYMENT_INTENT_ID = 'pi_test123';

function makeStripeClient() {
  return {
    accounts: {
      create: jest.fn(),
      retrieve: jest.fn(),
      createPerson: jest.fn(),
      update: jest.fn().mockResolvedValue({}),
      listExternalAccounts: jest.fn(),
      createExternalAccount: jest.fn().mockResolvedValue({ id: 'ba_new' }),
      deleteExternalAccount: jest.fn().mockResolvedValue({ deleted: true }),
    },
    accountLinks: {
      create: jest.fn(),
    },
    customers: {
      create: jest.fn(),
      retrieve: jest.fn(),
    },
    paymentMethods: {
      attach: jest.fn(),
    },
    paymentIntents: {
      create: jest.fn(),
      retrieve: jest.fn(),
    },
    checkout: {
      sessions: {
        create: jest.fn(),
      },
    },
    subscriptions: {
      retrieve: jest.fn(),
      update: jest.fn(),
    },
    refunds: {
      create: jest.fn(),
    },
    charges: {
      retrieve: jest.fn(),
    },
    transfers: {
      createReversal: jest.fn(),
    },
    invoices: {
      create: jest.fn().mockResolvedValue({ id: 'in_test' }),
      finalizeInvoice: jest.fn().mockResolvedValue({ id: 'in_test' }),
      pay: jest.fn().mockResolvedValue({ id: 'in_test', number: 'INV-1', hosted_invoice_url: 'https://pay' }),
    },
    invoiceItems: {
      create: jest.fn().mockResolvedValue({ id: 'ii_test' }),
    },
    products: {
      create: jest.fn().mockResolvedValue({ id: 'prod_test' }),
    },
    testHelpers: {
      testClocks: {
        create: jest.fn().mockResolvedValue({ id: 'clock_test' }),
        advance: jest.fn().mockResolvedValue({ id: 'clock_test', status: 'ready' }),
      },
    },
    webhooks: {
      constructEvent: jest.fn(),
    },
  };
}

describe('StripeService', () => {
  let module: TestingModule;
  let service: StripeService;
  let stripeClient: ReturnType<typeof makeStripeClient>;
  let stripeAccountRepo: ReturnType<typeof createMockRepository>;
  let eventEmitter: ReturnType<typeof createMockEventEmitter>;
  let txManager: { findOne: jest.Mock; save: jest.Mock; create: jest.Mock };

  beforeEach(async () => {
    stripeClient = makeStripeClient();
    stripeAccountRepo = createMockRepository();
    stripeAccountRepo.create.mockImplementation((d: any) => ({ ...d }));
    stripeAccountRepo.save.mockImplementation(async (r: any) => r);
    eventEmitter = createMockEventEmitter();
    // Controllable transaction manager so tests can drive what the account.updated handler
    // reads (findOne) and still exercise create/save used by onboardIndividualAccount.
    txManager = {
      findOne: jest.fn().mockResolvedValue(null),
      save: jest.fn().mockImplementation((_e: unknown, data: any) => ({ id: 'x', ...data })),
      create: jest.fn().mockImplementation((_e: unknown, data: any) => data),
    };
    const txHelper = { run: jest.fn().mockImplementation(async (cb: (qr: any) => Promise<unknown>) => cb({ manager: txManager })) };
    // Stateful cache mock so onboarding's ToS-snapshot get/set persists within a test.
    const cacheStore = new Map<string, unknown>();
    const cacheMock = {
      get: jest.fn(async (k: string) => cacheStore.get(k) ?? null),
      set: jest.fn(async (k: string, v: unknown) => { cacheStore.set(k, v); }),
      del: jest.fn(),
      delByPrefix: jest.fn(),
    };

    module = await Test.createTestingModule({
      providers: [
        StripeService,
        { provide: STRIPE_CLIENT, useValue: stripeClient },
        { provide: ConfigService, useValue: { get: jest.fn().mockReturnValue({ secretKey: 'sk_test_fake', webhookSecret: 'whsec_test', webhookSecretConnect: 'whsec_connect' }) } },
        { provide: getRepositoryToken(StripeAccount), useValue: stripeAccountRepo },
        { provide: TransactionHelper, useValue: txHelper },
        { provide: AzureStorageService, useValue: { uploadFile: jest.fn(), deleteFile: jest.fn() } },
        { provide: DomainEventEmitter, useValue: eventEmitter },
        { provide: AppCacheService, useValue: cacheMock },
      ],
    }).compile();

    service = module.get<StripeService>(StripeService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => module.close());

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ── onboardIndividualAccount ───────────────────────────────────────────────

  describe('onboardIndividualAccount', () => {
    const mockOnboardingData: IndividualOnboardingData = {
      userId: USER_ID,
      providerId: PROVIDER_ID,
      tosIpAddress: '192.168.1.1',
      bankAccountToken: 'btok_test',
      individual: {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@acme.com',
        phone: '+61400000000',
        dob: { day: 1, month: 1, year: 1990 },
        address: { line1: '123 Fake St', city: 'Sydney', state: 'NSW', postal_code: '2000', country: 'AU' },
      },
      businessProfile: { mcc: null },
      bankDetails: {
        accountNumber: '123456789',
        bsbNumber: '062-000',
        accountHolderName: 'John Doe',
      },
    };

    it('should return already_onboarded (after verifying the stored account is live) and skip create', async () => {
      stripeAccountRepo.findOne.mockResolvedValue({
        id: 'row-1',
        accountId: ACCOUNT_ID,
        payoutsEnabled: true,
        chargesEnabled: true,
      });
      // The stored account must be confirmed to still exist before short-circuiting.
      stripeClient.accounts.retrieve.mockResolvedValue({
        id: ACCOUNT_ID, payouts_enabled: true, charges_enabled: true, details_submitted: true,
        requirements: { currently_due: [] },
      });

      const result = await service.onboardIndividualAccount(mockOnboardingData);

      expect(stripeClient.accounts.retrieve).toHaveBeenCalledWith(ACCOUNT_ID);
      expect(stripeClient.accounts.create).not.toHaveBeenCalled();
      expect(result).toEqual({
        status: 'already_onboarded',
        account_id: ACCOUNT_ID,
        payouts_enabled: true,
        charges_enabled: true,
      });
    });

    it('clears a ghost row and re-onboards when the stored account was deleted in the Dashboard', async () => {
      stripeAccountRepo.findOne.mockResolvedValue({
        id: 'row-ghost', accountId: 'acct_deleted', payoutsEnabled: true, chargesEnabled: true,
      });
      const goneErr = new Stripe.errors.StripePermissionError({
        message: "The provided key does not have access to account 'acct_deleted' (or that account does not exist). Application access may have been revoked.",
        type: 'invalid_request_error',
      });
      // First retrieve = verifying the stored (ghost) account → gone. Second retrieve = verifying the
      // freshly created account → live.
      stripeClient.accounts.retrieve
        .mockRejectedValueOnce(goneErr)
        .mockResolvedValue({
          id: 'acct_new', payouts_enabled: true, charges_enabled: true, details_submitted: true,
          requirements: { currently_due: [] },
        });
      stripeClient.accounts.create.mockResolvedValue({ id: 'acct_new' });

      const result = await service.onboardIndividualAccount(mockOnboardingData);

      // Ghost row deleted, a real create happened, and success reflects the NEW account.
      expect(stripeAccountRepo.delete).toHaveBeenCalledWith({ id: 'row-ghost' });
      expect(stripeClient.accounts.create).toHaveBeenCalledTimes(1);
      expect(result).toEqual(expect.objectContaining({ status: 'success', account_id: 'acct_new' }));
    });

    it('self-heals when accounts.create replays a since-deleted account (bumps nonce, re-creates)', async () => {
      stripeAccountRepo.findOne.mockResolvedValue(null);
      const goneErr = new Stripe.errors.StripePermissionError({
        message: "does not have access to account 'acct_dead' (or that account does not exist)",
        type: 'invalid_request_error',
      });
      // create returns the replayed dead account first, then a genuinely new one.
      stripeClient.accounts.create
        .mockResolvedValueOnce({ id: 'acct_dead' })
        .mockResolvedValueOnce({ id: 'acct_fresh' });
      // verify(dead) → gone; verify(fresh) → live; final sync(fresh) → live.
      stripeClient.accounts.retrieve
        .mockRejectedValueOnce(goneErr)
        .mockResolvedValue({
          id: 'acct_fresh', payouts_enabled: true, charges_enabled: true, details_submitted: true,
          requirements: { currently_due: [] },
        });

      const result = await service.onboardIndividualAccount(mockOnboardingData);

      const calls = stripeClient.accounts.create.mock.calls;
      expect(calls).toHaveLength(2);
      // The retry must use a DIFFERENT idempotency key (nonce bumped) so Stripe creates fresh.
      expect(calls[0][1].idempotencyKey).not.toBe(calls[1][1].idempotencyKey);
      expect(result).toEqual(expect.objectContaining({ status: 'success', account_id: 'acct_fresh' }));
    });

    it('should successfully create an individual connected account and return status', async () => {
      stripeAccountRepo.findOne.mockResolvedValue(null);
      stripeClient.accounts.create.mockResolvedValue({ id: ACCOUNT_ID });
      stripeClient.accounts.retrieve.mockResolvedValue({
        id: ACCOUNT_ID,
        payouts_enabled: true,
        charges_enabled: true,
        details_submitted: true,
        requirements: { currently_due: [] },
      });

      const result = await service.onboardIndividualAccount(mockOnboardingData);

      expect(stripeClient.accounts.create).toHaveBeenCalledWith(
        expect.objectContaining({
          business_type: 'individual',
          country: 'AU',
          email: mockOnboardingData.individual.email,
          individual: expect.objectContaining({
            first_name: 'John',
            last_name: 'Doe',
            email: 'john@acme.com',
          }),
          external_account: expect.objectContaining({
            account_number: '123456789',
            routing_number: '062-000',
          }),
        }),
        // Key is scoped to the request parameters (hashed), not a static per-user string, so a
        // re-onboard with corrected details doesn't collide with a stale key.
        expect.objectContaining({ idempotencyKey: expect.stringMatching(/^onboard_[0-9a-f]{40}$/) }),
      );
      // No identityDocumentUrl provided → the upload/attach step must be skipped.
      expect(stripeClient.accounts.update).not.toHaveBeenCalled();

      expect(result).toEqual({
        status: 'success',
        account_id: ACCOUNT_ID,
        payouts_enabled: true,
        charges_enabled: true,
        requirements_due: [],
      });
    });

    it('should throw BadRequestException if Stripe throws a StripeError', async () => {
      stripeAccountRepo.findOne.mockResolvedValue(null);
      const stripeError = new Stripe.errors.StripeError({
        message: 'Invalid routing number',
        type: 'invalid_request_error',
      });
      stripeClient.accounts.create.mockRejectedValue(stripeError);

      await expect(service.onboardIndividualAccount(mockOnboardingData))
        .rejects.toThrow(BadRequestException);
      // Validation errors surface Stripe's user-actionable message behind a friendly lead-in.
      await expect(service.onboardIndividualAccount(mockOnboardingData))
        .rejects.toThrow("We couldn't verify your details: Invalid routing number");
    });

    it('should return a clean retry message for an idempotency conflict (never leak the raw key text)', async () => {
      stripeAccountRepo.findOne.mockResolvedValue(null);
      const idemErr = new Stripe.errors.StripeError({
        message: "Keys for idempotent requests can only be used with the same parameters they were first used with. Try using a key other than 'onboard_x'",
        type: 'idempotency_error',
      });
      stripeClient.accounts.create.mockRejectedValue(idemErr);

      await expect(service.onboardIndividualAccount(mockOnboardingData))
        .rejects.toThrow("We couldn't complete your onboarding right now. Please try again in a moment.");
      // The raw Stripe idempotency-key text must not reach the client.
      await expect(service.onboardIndividualAccount(mockOnboardingData))
        .rejects.not.toThrow(/idempotent|onboard_/);
    });

    it('should throw InternalServerErrorException for non-Stripe unexpected errors', async () => {
      stripeAccountRepo.findOne.mockResolvedValue(null);
      const genericError = new Error('Database connection lost');
      stripeClient.accounts.create.mockRejectedValue(genericError);

      await expect(service.onboardIndividualAccount(mockOnboardingData))
        .rejects.toThrow(InternalServerErrorException);
      await expect(service.onboardIndividualAccount(mockOnboardingData))
        .rejects.toThrow('An unexpected error occurred during onboarding');
    });

    it('should only request the transfers capability (providers receive payouts only)', async () => {
      stripeAccountRepo.findOne.mockResolvedValue(null);
      stripeClient.accounts.create.mockResolvedValue({ id: ACCOUNT_ID });
      stripeClient.accounts.retrieve.mockResolvedValue({
        id: ACCOUNT_ID, payouts_enabled: true, charges_enabled: true, details_submitted: true,
        requirements: { currently_due: [] },
      });

      await service.onboardIndividualAccount(mockOnboardingData);

      const createArg = stripeClient.accounts.create.mock.calls[0][0];
      expect(createArg.capabilities).toEqual({ transfers: { requested: true } });
      expect(createArg.capabilities.card_payments).toBeUndefined();
      expect(createArg.capabilities.au_becs_debit_payments).toBeUndefined();
    });

    it('reuses the same tos_acceptance across retries so the idempotency key never mismatches', async () => {
      stripeAccountRepo.findOne.mockResolvedValue(null);
      stripeClient.accounts.create.mockResolvedValue({ id: ACCOUNT_ID });
      stripeClient.accounts.retrieve.mockResolvedValue({
        id: ACCOUNT_ID, payouts_enabled: true, charges_enabled: true, details_submitted: true,
        requirements: { currently_due: [] },
      });

      await service.onboardIndividualAccount(mockOnboardingData);
      await service.onboardIndividualAccount(mockOnboardingData);

      const calls = stripeClient.accounts.create.mock.calls;
      expect(calls).toHaveLength(2);
      // Same idempotency key AND byte-identical tos_acceptance → Stripe accepts the retry instead
      // of throwing "same key, different parameters".
      expect(calls[0][1].idempotencyKey).toBe(calls[1][1].idempotencyKey);
      expect(calls[0][0].tos_acceptance).toEqual(calls[1][0].tos_acceptance);
    });

    it('attaches only the front when front and back resolve to the same token (test-mode canned token)', async () => {
      stripeAccountRepo.findOne.mockResolvedValue(null);
      stripeClient.accounts.create.mockResolvedValue({ id: ACCOUNT_ID });
      stripeClient.accounts.retrieve.mockResolvedValue({
        id: ACCOUNT_ID, payouts_enabled: true, charges_enabled: true, details_submitted: true,
        requirements: { currently_due: [] },
      });

      const withDocs: IndividualOnboardingData = {
        ...mockOnboardingData,
        individual: {
          ...mockOnboardingData.individual,
          identityDocumentFrontUrl: 'https://blob/license-front.jpg',
          identityDocumentBackUrl: 'https://blob/license-back.jpg',
        },
      };

      const result = await service.onboardIndividualAccount(withDocs);

      // Both sides resolve to Stripe's one canned test token; sending it as both front AND back
      // is rejected ("same file"), so only the front must be attached — and it must not throw.
      expect(stripeClient.accounts.update).toHaveBeenCalledWith(
        ACCOUNT_ID,
        {
          individual: { verification: { document: { front: 'file_identity_document_success' } } },
        },
      );
      const updateArg = stripeClient.accounts.update.mock.calls[0][1] as any;
      expect(updateArg.individual.verification.document.back).toBeUndefined();
      expect(result.status).toBe('success');
    });
  });

  // ── createOnboardingAccountLink ────────────────────────────────────────────

  describe('createOnboardingAccountLink', () => {
    it('should create an account_onboarding link for the provider\'s connected account', async () => {
      stripeAccountRepo.findOne.mockResolvedValue({ accountId: ACCOUNT_ID });
      stripeClient.accountLinks.create.mockResolvedValue({ url: 'https://connect.stripe.com/setup/abc' });

      const result = await service.createOnboardingAccountLink(USER_ID);

      expect(stripeClient.accountLinks.create).toHaveBeenCalledWith(
        expect.objectContaining({ account: ACCOUNT_ID, type: 'account_onboarding' }),
      );
      expect(result).toEqual({ url: 'https://connect.stripe.com/setup/abc' });
    });

    it('should throw BadRequestException when the provider has no Stripe account yet', async () => {
      stripeAccountRepo.findOne.mockResolvedValue(null);

      await expect(service.createOnboardingAccountLink(USER_ID)).rejects.toThrow(BadRequestException);
      expect(stripeClient.accountLinks.create).not.toHaveBeenCalled();
    });
  });

  // ── updateExternalBankAccount ──────────────────────────────────────────────

  describe('updateExternalBankAccount', () => {
    it('should add the new default account and delete the stale ones (no accumulation)', async () => {
      stripeAccountRepo.findOne.mockResolvedValue({ accountId: ACCOUNT_ID });
      stripeClient.accounts.listExternalAccounts.mockResolvedValue({
        data: [{ id: 'ba_old1' }, { id: 'ba_old2' }],
      });

      await service.updateExternalBankAccount(USER_ID, '999888777', '062-111', 'Jane Doe');

      expect(stripeClient.accounts.createExternalAccount).toHaveBeenCalledWith(
        ACCOUNT_ID,
        expect.objectContaining({
          external_account: expect.objectContaining({
            account_number: '999888777',
            routing_number: '062-111',
            default_for_currency: true,
          }),
        }),
      );
      expect(stripeClient.accounts.deleteExternalAccount).toHaveBeenCalledWith(ACCOUNT_ID, 'ba_old1');
      expect(stripeClient.accounts.deleteExternalAccount).toHaveBeenCalledWith(ACCOUNT_ID, 'ba_old2');
    });

    it('should no-op when the provider has no connected account', async () => {
      stripeAccountRepo.findOne.mockResolvedValue(null);

      await service.updateExternalBankAccount(USER_ID, '999', '062-111', 'Jane Doe');

      expect(stripeClient.accounts.createExternalAccount).not.toHaveBeenCalled();
      expect(stripeClient.accounts.listExternalAccounts).not.toHaveBeenCalled();
    });

    it('should not fail the update when deleting a stale account errors', async () => {
      stripeAccountRepo.findOne.mockResolvedValue({ accountId: ACCOUNT_ID });
      stripeClient.accounts.listExternalAccounts.mockResolvedValue({ data: [{ id: 'ba_old1' }] });
      stripeClient.accounts.deleteExternalAccount.mockRejectedValueOnce(new Error('cannot delete default'));

      await expect(
        service.updateExternalBankAccount(USER_ID, '999', '062-111', 'Jane Doe'),
      ).resolves.toBeUndefined();

      expect(stripeClient.accounts.createExternalAccount).toHaveBeenCalled();
    });
  });

  // ── handleAccountUpdatedEvent (provider notifications) ──────────────────────

  // ── deriveOnboardingSnapshot ───────────────────────────────────────────────
  //
  // This is what GET /me/stripe/status reports. Test mode auto-approves everything, so these
  // are the only coverage of what a live provider actually sees while Stripe deliberates.
  describe('deriveOnboardingSnapshot', () => {
    const derive = (account: object) => (service as any).deriveOnboardingSnapshot(account);

    it('should report enabled when charges and payouts are both live', () => {
      expect(derive({ charges_enabled: true, payouts_enabled: true, requirements: { currently_due: [] } }))
        .toEqual({ state: 'enabled', requirementsDue: [], disabledReason: null });
    });

    it('should report pending while Stripe verifies and wants nothing from the provider', () => {
      // The case that had no representation before: not enabled, but nothing to act on.
      expect(
        derive({
          charges_enabled: false,
          payouts_enabled: false,
          requirements: {
            currently_due: [],
            past_due: [],
            pending_verification: ['individual.verification.document'],
            disabled_reason: 'requirements.pending_verification',
          },
        }),
      ).toEqual({
        state: 'pending',
        requirementsDue: [],
        disabledReason: 'requirements.pending_verification',
      });
    });

    it('should treat under_review as pending, not as action required', () => {
      expect(
        derive({
          charges_enabled: false,
          payouts_enabled: false,
          requirements: { currently_due: [], disabled_reason: 'under_review' },
        }).state,
      ).toBe('pending');
    });

    it('should report action_required with the outstanding requirements', () => {
      expect(
        derive({
          charges_enabled: false,
          payouts_enabled: false,
          requirements: {
            currently_due: ['individual.verification.document', 'external_account'],
            past_due: [],
          },
        }),
      ).toEqual({
        state: 'action_required',
        requirementsDue: ['individual.verification.document', 'external_account'],
        disabledReason: null,
      });
    });

    it('should merge past_due into requirementsDue without duplicating', () => {
      expect(
        derive({
          charges_enabled: false,
          payouts_enabled: false,
          requirements: {
            currently_due: ['individual.id_number', 'external_account'],
            past_due: ['individual.id_number'],
          },
        }).requirementsDue,
      ).toEqual(['individual.id_number', 'external_account']);
    });

    it('should report action_required for a blocking disabled_reason even with nothing due', () => {
      expect(
        derive({
          charges_enabled: false,
          payouts_enabled: false,
          requirements: { currently_due: [], disabled_reason: 'rejected.fraud' },
        }),
      ).toEqual({ state: 'action_required', requirementsDue: [], disabledReason: 'rejected.fraud' });
    });

    it('should report pending when Stripe sends no requirements block at all', () => {
      expect(derive({ charges_enabled: false, payouts_enabled: false }))
        .toEqual({ state: 'pending', requirementsDue: [], disabledReason: null });
    });

    it('should stay enabled even if eventually_due has entries', () => {
      // eventually_due is not blocking and must not drag a live account out of enabled.
      expect(
        derive({
          charges_enabled: true,
          payouts_enabled: true,
          requirements: { currently_due: [], eventually_due: ['individual.verification.additional_document'] },
        }).state,
      ).toBe('enabled');
    });
  });

  describe('handleAccountUpdatedEvent', () => {
    it('should persist the onboarding snapshot so /status can explain itself', async () => {
      const record = {
        accountId: ACCOUNT_ID,
        provider: { id: USER_ID },
        chargesEnabled: false,
        payoutsEnabled: false,
        onboardingCompletedAt: null,
      };
      txManager.findOne.mockResolvedValue(record);

      await service.handleAccountUpdatedEvent({
        id: ACCOUNT_ID,
        payouts_enabled: false,
        charges_enabled: false,
        requirements: { currently_due: ['external_account'], past_due: [] },
      } as any);

      const saved = txManager.save.mock.calls[0][1];
      expect(saved.onboardingState).toBe('action_required');
      expect(saved.requirementsDue).toEqual(['external_account']);
      expect(saved.requirementsSyncedAt).toBeInstanceOf(Date);
    });

    it('should persist pending without notifying — Stripe is still deciding', async () => {
      txManager.findOne.mockResolvedValue({
        accountId: ACCOUNT_ID,
        provider: { id: USER_ID },
        chargesEnabled: false,
        payoutsEnabled: false,
        onboardingCompletedAt: null,
      });

      await service.handleAccountUpdatedEvent({
        id: ACCOUNT_ID,
        payouts_enabled: false,
        charges_enabled: false,
        requirements: { currently_due: [], disabled_reason: 'requirements.pending_verification' },
      } as any);

      expect(txManager.save.mock.calls[0][1].onboardingState).toBe('pending');
      // The provider has nothing to do, so we must not nag them.
      expect(eventEmitter.emit).not.toHaveBeenCalled();
    });

    it('should emit an "enabled" event on the transition to fully enabled', async () => {
      txManager.findOne.mockResolvedValue({
        accountId: ACCOUNT_ID,
        provider: { id: USER_ID },
        chargesEnabled: false,
        payoutsEnabled: false,
        onboardingCompletedAt: null,
      });

      await service.handleAccountUpdatedEvent({
        id: ACCOUNT_ID, payouts_enabled: true, charges_enabled: true,
      } as any);

      expect(eventEmitter.emit).toHaveBeenCalledTimes(1);
      const emitted = eventEmitter.emit.mock.calls[0][0];
      expect(emitted.providerUserId).toBe(USER_ID);
      expect(emitted.status).toBe('enabled');
    });

    it('should emit an "action_required" event when a previously-enabled account is restricted', async () => {
      txManager.findOne.mockResolvedValue({
        accountId: ACCOUNT_ID,
        provider: { id: USER_ID },
        chargesEnabled: true,
        payoutsEnabled: true,
        onboardingCompletedAt: new Date('2026-01-01'),
      });

      await service.handleAccountUpdatedEvent({
        id: ACCOUNT_ID, payouts_enabled: false, charges_enabled: true,
        requirements: { disabled_reason: 'requirements.past_due' },
      } as any);

      expect(eventEmitter.emit).toHaveBeenCalledTimes(1);
      const emitted = eventEmitter.emit.mock.calls[0][0];
      expect(emitted.status).toBe('action_required');
      expect(emitted.disabledReason).toBe('requirements.past_due');
    });

    it('should emit "action_required" when initial verification never enabled the account (past_due)', async () => {
      // The gap-closing case: provider onboarded, Stripe came back needing documents, account
      // never reached enabled and was never previously enabled.
      txManager.findOne.mockResolvedValue({
        accountId: ACCOUNT_ID,
        provider: { id: USER_ID },
        chargesEnabled: false,
        payoutsEnabled: false,
        onboardingCompletedAt: null,
        lastNotifiedStatus: null,
      });

      await service.handleAccountUpdatedEvent({
        id: ACCOUNT_ID, payouts_enabled: false, charges_enabled: false,
        requirements: { past_due: ['individual.verification.document'], currently_due: [] },
      } as any);

      expect(eventEmitter.emit).toHaveBeenCalledTimes(1);
      expect(eventEmitter.emit.mock.calls[0][0].status).toBe('action_required');
    });

    it('should NOT emit during normal pending verification (no past_due, in-progress reason)', async () => {
      txManager.findOne.mockResolvedValue({
        accountId: ACCOUNT_ID,
        provider: { id: USER_ID },
        chargesEnabled: false,
        payoutsEnabled: false,
        onboardingCompletedAt: null,
        lastNotifiedStatus: null,
      });

      await service.handleAccountUpdatedEvent({
        id: ACCOUNT_ID, payouts_enabled: false, charges_enabled: false,
        requirements: { past_due: [], currently_due: ['individual.dob.day'], disabled_reason: 'requirements.pending_verification' },
      } as any);

      expect(eventEmitter.emit).not.toHaveBeenCalled();
    });

    it('should NOT re-emit when the status equals what we last notified (dedup)', async () => {
      txManager.findOne.mockResolvedValue({
        accountId: ACCOUNT_ID,
        provider: { id: USER_ID },
        chargesEnabled: true,
        payoutsEnabled: true,
        onboardingCompletedAt: new Date('2026-01-01'),
        lastNotifiedStatus: 'enabled',
      });

      await service.handleAccountUpdatedEvent({
        id: ACCOUNT_ID, payouts_enabled: true, charges_enabled: true,
      } as any);

      expect(eventEmitter.emit).not.toHaveBeenCalled();
    });

    it('should skip (no save, no emit) when no provider row exists for the account', async () => {
      // account.updated also fires for the platform's own account and for orphan/duplicate
      // connected accounts with no provider mapping. A provider-less row can't be inserted
      // (provider_user_id is NOT NULL), so we skip rather than crash and retry forever.
      txManager.findOne.mockResolvedValue(null);

      await service.handleAccountUpdatedEvent({
        id: ACCOUNT_ID, payouts_enabled: true, charges_enabled: true,
      } as any);

      expect(txManager.save).not.toHaveBeenCalled();
      expect(eventEmitter.emit).not.toHaveBeenCalled();
    });
  });

  // ── retrieveConnectedAccount ───────────────────────────────────────────────

  describe('getOnboardingStatus', () => {
    const syncedRecord = (over: object = {}) => ({
      id: 'rec-1',
      accountId: ACCOUNT_ID,
      provider: { id: USER_ID, email: 'p@example.com' },
      chargesEnabled: false,
      payoutsEnabled: false,
      onboardingCompletedAt: null,
      onboardingState: 'pending',
      requirementsDue: [],
      disabledReason: null,
      requirementsSyncedAt: new Date('2026-07-17T09:38:28.521Z'),
      ...over,
    });

    it('should report not_started when the provider has no Stripe account', async () => {
      stripeAccountRepo.findOne.mockResolvedValue(null);

      expect(await service.getOnboardingStatus(USER_ID)).toEqual({
        onboarded: false,
        state: 'not_started',
        chargesEnabled: false,
        payoutsEnabled: false,
        requirementsDue: [],
        disabledReason: null,
        onboardingCompletedAt: null,
        requirementsSyncedAt: null,
        email: null,
      });
    });

    it('should serve an enabled synced record from the database without calling Stripe', async () => {
      // Once enabled, status is a terminal-good state the account.updated webhook maintains, so a
      // Stripe round trip per poll would be pure latency and rate limit.
      stripeAccountRepo.findOne.mockResolvedValue(
        syncedRecord({
          chargesEnabled: true,
          payoutsEnabled: true,
          onboardingState: 'enabled',
        }),
      );

      const result = await service.getOnboardingStatus(USER_ID);

      expect(stripeClient.accounts.retrieve).not.toHaveBeenCalled();
      expect(result.state).toBe('enabled');
      expect(result.onboarded).toBe(true);
    });

    it('should re-sync from Stripe while not yet enabled (webhook may be missed)', async () => {
      // A non-enabled account can be stale: Stripe activates optimistically and account.updated
      // can be missed, so polling must re-fetch to catch a verification that has since completed
      // or failed. Here the stored row says 'pending' but Stripe now reports a failed check.
      stripeAccountRepo.findOne.mockResolvedValue(syncedRecord({ onboardingState: 'pending' }));
      stripeClient.accounts.retrieve.mockResolvedValue({
        id: ACCOUNT_ID,
        charges_enabled: true,
        payouts_enabled: true,
        requirements: {
          currently_due: ['individual.verification.document'],
          past_due: [],
          errors: [{ code: 'verification_failed_keyed_identity', reason: 'x', requirement: 'individual.verification.document' }],
          pending_verification: [],
          disabled_reason: null,
        },
      } as any);

      const result = await service.getOnboardingStatus(USER_ID);

      expect(stripeClient.accounts.retrieve).toHaveBeenCalledWith(ACCOUNT_ID);
      expect(result.state).toBe('action_required');
      expect(result.requirementsDue).toEqual(['individual.verification.document']);
      expect(result.onboarded).toBe(false);
    });

    it('should report enabled with onboarded true once both flags are live', async () => {
      stripeAccountRepo.findOne.mockResolvedValue(
        syncedRecord({
          chargesEnabled: true,
          payoutsEnabled: true,
          onboardingState: 'enabled',
          onboardingCompletedAt: new Date('2026-07-17T09:38:28.521Z'),
        }),
      );

      const result = await service.getOnboardingStatus(USER_ID);

      expect(result.onboarded).toBe(true);
      expect(result.state).toBe('enabled');
      expect(result.requirementsDue).toEqual([]);
    });

    it('should backfill from Stripe once when the record has never been synced', async () => {
      // Rows created before this column existed, or whose webhook never arrived. Serving the
      // defaulted 'pending' would be a guess.
      stripeAccountRepo.findOne.mockResolvedValue(syncedRecord({ requirementsSyncedAt: null }));
      stripeClient.accounts.retrieve.mockResolvedValue({
        id: ACCOUNT_ID,
        charges_enabled: false,
        payouts_enabled: false,
        requirements: { currently_due: ['external_account'], past_due: [] },
      });

      const result = await service.getOnboardingStatus(USER_ID);

      expect(stripeClient.accounts.retrieve).toHaveBeenCalledWith(ACCOUNT_ID);
      expect(result.state).toBe('action_required');
      expect(result.requirementsDue).toEqual(['external_account']);
      // Persisted, so the next poll is served from the database.
      expect(stripeAccountRepo.update).toHaveBeenCalledWith(
        'rec-1',
        expect.objectContaining({ onboardingState: 'action_required' }),
      );
    });

    it('should not fail the status read when the Stripe backfill errors', async () => {
      stripeAccountRepo.findOne.mockResolvedValue(
        syncedRecord({ requirementsSyncedAt: null, chargesEnabled: true, payoutsEnabled: true, onboardingState: 'enabled' }),
      );
      stripeClient.accounts.retrieve.mockRejectedValue(new Error('Stripe is down'));

      const result = await service.getOnboardingStatus(USER_ID);

      // Falls back to the stored state rather than 500ing.
      expect(result.onboarded).toBe(true);
      expect(result.email).toBe('p@example.com');
    });
  });

  describe('retrieveConnectedAccount', () => {
    it('should retrieve account details', async () => {
      const account = { id: ACCOUNT_ID, charges_enabled: true };
      stripeClient.accounts.retrieve.mockResolvedValue(account);

      const result = await service.retrieveConnectedAccount(ACCOUNT_ID);

      expect(stripeClient.accounts.retrieve).toHaveBeenCalledWith(ACCOUNT_ID);
      expect(result.id).toBe(ACCOUNT_ID);
    });
  });

  // ── create (customer) ──────────────────────────────────────────────────────

  describe('create (customer)', () => {
    it('should create a stripe customer', async () => {
      const customer = { id: CUSTOMER_ID };
      stripeClient.customers.create.mockResolvedValue(customer);

      const result = await service.create('John Doe', 'john@test.com', USER_ID);

      expect(stripeClient.customers.create).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'John Doe', email: 'john@test.com' }),
      );
      // No test clock by default (flag off) — customer created without one.
      expect(stripeClient.customers.create.mock.calls[0][0].test_clock).toBeUndefined();
      expect(stripeClient.testHelpers.testClocks.create).not.toHaveBeenCalled();
      expect(result.id).toBe(CUSTOMER_ID);
    });

    it('should attach a test clock when STRIPE_TEST_CLOCK_ENABLED=true on a test key', async () => {
      stripeClient.customers.create.mockResolvedValue({ id: CUSTOMER_ID });
      const prev = process.env.STRIPE_TEST_CLOCK_ENABLED;
      process.env.STRIPE_TEST_CLOCK_ENABLED = 'true'; // STRIPE_SEC_KEY is a test key in jest setup
      try {
        await service.create('John Doe', 'john@test.com', USER_ID);
        expect(stripeClient.testHelpers.testClocks.create).toHaveBeenCalled();
        expect(stripeClient.customers.create.mock.calls[0][0].test_clock).toBe('clock_test');
      } finally {
        if (prev === undefined) delete process.env.STRIPE_TEST_CLOCK_ENABLED;
        else process.env.STRIPE_TEST_CLOCK_ENABLED = prev;
      }
    });

    it('should NEVER attach a test clock on a live key, even when the flag is on', async () => {
      stripeClient.customers.create.mockResolvedValue({ id: CUSTOMER_ID });
      const prevFlag = process.env.STRIPE_TEST_CLOCK_ENABLED;
      const prevKey = process.env.STRIPE_SEC_KEY;
      process.env.STRIPE_TEST_CLOCK_ENABLED = 'true';
      process.env.STRIPE_SEC_KEY = 'sk_live_example';
      try {
        await service.create('John Doe', 'john@test.com', USER_ID);
        expect(stripeClient.testHelpers.testClocks.create).not.toHaveBeenCalled();
        expect(stripeClient.customers.create.mock.calls[0][0].test_clock).toBeUndefined();
      } finally {
        if (prevFlag === undefined) delete process.env.STRIPE_TEST_CLOCK_ENABLED;
        else process.env.STRIPE_TEST_CLOCK_ENABLED = prevFlag;
        process.env.STRIPE_SEC_KEY = prevKey;
      }
    });
  });

  // ── createPaymentIntent ────────────────────────────────────────────────────

  describe('createPaymentIntent', () => {
    it('should return client_secret and payment_intent_id', async () => {
      stripeClient.paymentIntents.create.mockResolvedValue({
        id: PAYMENT_INTENT_ID,
        client_secret: 'pi_secret_xyz',
      });

      const paymentInfo: MakePaymentIntent = {
        jobId: 'job-1',
        amount: 5000,
        customer: CUSTOMER_ID,
        paymentMethod: 'pm_test123',
        providerAccountId: ACCOUNT_ID,
        applicationFeeAmount: 500,
        taxGstAmmount: 50,
        futureUsage: false,
        seekerUserId: USER_ID,
        providerUserId: PROVIDER_ID,
      };

      const result = await service.createPaymentIntent(paymentInfo);

      expect(stripeClient.paymentIntents.create).toHaveBeenCalledWith(
        expect.objectContaining({ amount: 5000, currency: 'aud', customer: CUSTOMER_ID }),
      );
      expect(result.payment_intent_id).toBe(PAYMENT_INTENT_ID);
      expect(result.client_secret).toBe('pi_secret_xyz');
    });
  });

  // ── getPaymentDetails ──────────────────────────────────────────────────────

  describe('getPaymentDetails', () => {
    it('should return formatted payment details', async () => {
      stripeClient.paymentIntents.retrieve.mockResolvedValue({
        id: PAYMENT_INTENT_ID,
        amount: 5000,
        currency: 'aud',
        status: 'succeeded',
        created: 1700000000,
        customer: CUSTOMER_ID,
        metadata: { provider_id: ACCOUNT_ID },
      });

      const result = await service.getPaymentDetails(PAYMENT_INTENT_ID);

      expect(result.id).toBe(PAYMENT_INTENT_ID);
      expect(result.amount).toBe(5000);
      expect(result.provider).toBe(ACCOUNT_ID);
    });
  });

  // ── createSubscriptionCheckout ─────────────────────────────────────────────

  describe('createSubscriptionCheckout', () => {
    it('should return checkout_url and session_id', async () => {
      stripeClient.checkout.sessions.create.mockResolvedValue({
        id: 'cs_test123',
        url: 'https://checkout.stripe.com/pay/session',
      });

      const result = await service.createSubscriptionCheckout(CUSTOMER_ID, PRICE_ID);

      expect(stripeClient.checkout.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({ mode: 'subscription', customer: CUSTOMER_ID }),
      );
      expect(result.checkout_url).toBe('https://checkout.stripe.com/pay/session');
      expect(result.session_id).toBe('cs_test123');
    });
  });

  // ── getSubscriptionById ────────────────────────────────────────────────────

  describe('getSubscriptionById', () => {
    it('should retrieve subscription by id', async () => {
      const sub = { id: SUBSCRIPTION_ID, status: 'active' };
      stripeClient.subscriptions.retrieve.mockResolvedValue(sub);

      const result = await service.getSubscriptionById(SUBSCRIPTION_ID);

      expect(stripeClient.subscriptions.retrieve).toHaveBeenCalledWith(SUBSCRIPTION_ID);
      expect(result.id).toBe(SUBSCRIPTION_ID);
    });
  });

  // ── scheduleSubscriptionCancellation ───────────────────────────────────────

  describe('scheduleSubscriptionCancellation', () => {
    it('should schedule cancel_at and pause collection so no further cycle is charged', async () => {
      const cancelAt = Math.floor(Date.now() / 1000) + 14 * 24 * 60 * 60;
      stripeClient.subscriptions.update.mockResolvedValue({
        id: SUBSCRIPTION_ID,
        status: 'active',
        cancel_at: cancelAt,
      });

      const result = await service.scheduleSubscriptionCancellation(
        SUBSCRIPTION_ID,
        cancelAt,
        'No longer needed',
      );

      expect(stripeClient.subscriptions.update).toHaveBeenCalledWith(
        SUBSCRIPTION_ID,
        expect.objectContaining({
          cancel_at: cancelAt,
          pause_collection: { behavior: 'void' },
        }),
      );
      expect(result.id).toBe(SUBSCRIPTION_ID);
    });
  });

  // ── createRefund ───────────────────────────────────────────────────────────

  describe('createRefund', () => {
    it('should call stripe.refunds.create with charge id, amount and reverse_transfer', async () => {
      stripeClient.refunds.create.mockResolvedValue({
        id: 're_test123',
        amount: 15000,
        status: 'succeeded',
      });

      const result = await service.createRefund('ch_test123', 15000, 'poor_service_quality');

      // Second arg is Stripe request options — undefined here since no idempotencyKey was passed.
      expect(stripeClient.refunds.create).toHaveBeenCalledWith(
        expect.objectContaining({
          charge: 'ch_test123',
          amount: 15000,
          reverse_transfer: true,
        }),
        undefined,
      );
      expect(result.id).toBe('re_test123');
      expect(result.amount).toBe(15000);
    });

    it('should pass idempotencyKey as Stripe request options when provided', async () => {
      stripeClient.refunds.create.mockResolvedValue({ id: 're_test123', amount: 15000, status: 'succeeded' });

      await service.createRefund('ch_test123', 15000, 'poor_service_quality', 'refund:cancel:ch_test123');

      expect(stripeClient.refunds.create).toHaveBeenCalledWith(
        expect.objectContaining({ charge: 'ch_test123' }),
        { idempotencyKey: 'refund:cancel:ch_test123' },
      );
    });

    it('should propagate Stripe errors', async () => {
      stripeClient.refunds.create.mockRejectedValue(new Error('Stripe error'));

      await expect(service.createRefund('ch_test', 1000)).rejects.toThrow('Stripe error');
    });

    it('should forward the reverseTransfer flag (false) to Stripe', async () => {
      stripeClient.refunds.create.mockResolvedValue({ id: 're_x', amount: 9000, status: 'succeeded' });

      await service.createRefund('ch_test123', 9000, 'seeker_cancellation', 'refund:cancel:ch_test123', false);

      expect(stripeClient.refunds.create).toHaveBeenCalledWith(
        expect.objectContaining({ reverse_transfer: false }),
        { idempotencyKey: 'refund:cancel:ch_test123' },
      );
    });
  });

  // ── reverseChargeTransfer ──────────────────────────────────────────────────

  describe('reverseChargeTransfer', () => {
    it('reverses the full transfer for a charge', async () => {
      stripeClient.charges.retrieve.mockResolvedValue({ id: 'ch_1', transfer: 'tr_1' });
      stripeClient.transfers.createReversal.mockResolvedValue({ id: 'trr_1', amount: 10000 });

      const result = await service.reverseChargeTransfer('ch_1', 10000, 'reverse:cancel:ch_1');

      expect(stripeClient.transfers.createReversal).toHaveBeenCalledWith(
        'tr_1',
        { amount: 10000 },
        { idempotencyKey: 'reverse:cancel:ch_1' },
      );
      expect(result?.id).toBe('trr_1');
    });

    it('returns null (no-op) when the charge has no transfer', async () => {
      stripeClient.charges.retrieve.mockResolvedValue({ id: 'ch_1', transfer: null });

      const result = await service.reverseChargeTransfer('ch_1', 10000);

      expect(result).toBeNull();
      expect(stripeClient.transfers.createReversal).not.toHaveBeenCalled();
    });
  });

  describe('createAndFinalizeJobInvoice', () => {
    // Lines now use tax-engine price_data (unit_amount + tax_behavior), so Stripe renders the GST
    // breakdown itself — matching the per-cycle subscription invoices.
    const lineItems = () =>
      stripeClient.invoiceItems.create.mock.calls.map((c: any[]) => ({
        amount: c[0].price_data?.unit_amount,
        description: c[0].description,
        tax_behavior: c[0].price_data?.tax_behavior,
      }));

    it('renders two tax-inclusive lines (GST-free job + standard fee) with automatic_tax on', async () => {
      // service 1.76, gross fee 0.44 (net 0.24 + GST 0.20) → total 2.20; Stripe computes the GST.
      await service.createAndFinalizeJobInvoice(
        'cus_1',
        'job-1',
        'pi_1',
        { serviceCents: 176, feeCents: 24, gstCents: 20, feePercent: 11.99 },
        { jobRef: 'JOB-1', jobTitle: 'Brickwork' },
      );

      const items = lineItems();
      expect(items).toEqual([
        { amount: 176, description: 'JOB-1 — Brickwork', tax_behavior: 'inclusive' },
        { amount: 44, description: 'Taskora service fee (11.99%)', tax_behavior: 'inclusive' }, // gross = 24 + 20
      ]);
      // Lines sum to exactly what the seeker paid.
      expect(items.reduce((s: number, i: any) => s + i.amount, 0)).toBe(220);
      // GST is a separate line Stripe derives from the inclusive fee — automatic_tax must be enabled.
      expect(stripeClient.invoices.create).toHaveBeenCalledWith(
        expect.objectContaining({ automatic_tax: { enabled: true } }),
      );
      expect(stripeClient.invoices.finalizeInvoice).toHaveBeenCalled();
      expect(stripeClient.invoices.pay).toHaveBeenCalledWith('in_test', { paid_out_of_band: true });
    });

    it('omits the fee line when it is zero', async () => {
      await service.createAndFinalizeJobInvoice(
        'cus_1',
        'job-1',
        'pi_1',
        { serviceCents: 500, feeCents: 0, gstCents: 0, feePercent: null },
        { jobRef: 'JOB-2', jobTitle: 'Task' },
      );

      const items = lineItems();
      expect(items).toHaveLength(1);
      expect(items[0]).toEqual({ amount: 500, description: 'JOB-2 — Task', tax_behavior: 'inclusive' });
    });

    it('labels the fee without a percent when none is provided', async () => {
      await service.createAndFinalizeJobInvoice(
        'cus_1',
        'job-1',
        'pi_1',
        { serviceCents: 100, feeCents: 12, gstCents: 11, feePercent: null },
        { jobRef: 'JOB-3', jobTitle: 'Task' },
      );

      // Gross fee = net 12 + GST 11 = 23, no percent in the label.
      expect(lineItems()).toContainEqual({ amount: 23, description: 'Taskora service fee', tax_behavior: 'inclusive' });
    });

    it('adds the installment note and a date-range period on every line (summary invoice)', async () => {
      await service.createAndFinalizeJobInvoice(
        'cus_1',
        'job-1',
        'sub_1',
        { serviceCents: 12204, feeCents: 1331, gstCents: 133, feePercent: 11.99 },
        { jobRef: 'JOB-4', jobTitle: 'test 6 month', installmentNote: '12 installments of A$10.17', periodStart: 100, periodEnd: 200 },
      );

      const calls = stripeClient.invoiceItems.create.mock.calls;
      expect(calls[0][0].description).toBe('JOB-4 — test 6 month (12 installments of A$10.17)');
      expect(calls[0][0].period).toEqual({ start: 100, end: 200 });
      expect(calls[1][0].period).toEqual({ start: 100, end: 200 });
    });
  });

  describe('verifyWebhookSignature', () => {
    const sigError = () => {
      const e = new Error('bad signature');
      Object.setPrototypeOf(e, Stripe.errors.StripeSignatureVerificationError.prototype);
      return e;
    };

    it('accepts an event signed with the "Your account" secret', () => {
      const event = { id: 'evt_1', type: 'payment_intent.succeeded' };
      stripeClient.webhooks.constructEvent.mockReturnValueOnce(event);

      expect(service.verifyWebhookSignature('body', 'sig')).toBe(event);
      expect(stripeClient.webhooks.constructEvent).toHaveBeenCalledWith('body', 'sig', 'whsec_test');
    });

    it('falls back to the "Connected accounts" secret when the first does not match', () => {
      const event = { id: 'evt_2', type: 'account.updated' };
      // First secret (Your account) rejects; second (Connected accounts) verifies.
      stripeClient.webhooks.constructEvent
        .mockImplementationOnce(() => { throw sigError(); })
        .mockReturnValueOnce(event);

      expect(service.verifyWebhookSignature('body', 'sig')).toBe(event);
      expect(stripeClient.webhooks.constructEvent).toHaveBeenNthCalledWith(1, 'body', 'sig', 'whsec_test');
      expect(stripeClient.webhooks.constructEvent).toHaveBeenNthCalledWith(2, 'body', 'sig', 'whsec_connect');
    });

    it('throws when the signature matches neither secret', () => {
      stripeClient.webhooks.constructEvent.mockImplementation(() => { throw sigError(); });

      expect(() => service.verifyWebhookSignature('body', 'sig')).toThrow('Invalid webhook signature');
      expect(stripeClient.webhooks.constructEvent).toHaveBeenCalledTimes(2);
    });

    it('rethrows a non-signature error immediately without trying the next secret', () => {
      stripeClient.webhooks.constructEvent.mockImplementationOnce(() => { throw new Error('malformed payload'); });

      expect(() => service.verifyWebhookSignature('body', 'sig')).toThrow('malformed payload');
      expect(stripeClient.webhooks.constructEvent).toHaveBeenCalledTimes(1);
    });
  });
});
