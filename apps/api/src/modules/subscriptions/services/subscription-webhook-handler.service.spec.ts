import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SubscriptionWebhookHandlerService } from './subscription-webhook-handler.service';
import { Payment } from '../../../database/entities/payment.entity';
import { Transaction } from '../../../database/entities/transaction.entity';
import { AuditLog } from '../../../database/entities/audit-log.entity';
import { Selection } from '../../../database/entities/selection.entity';
import { Bid } from '../../../database/entities/bid.entity';
import { Job } from '../../../database/entities/job.entity';
import { JobContract } from '../../../database/entities/job-contract.entity';
import { TransactionHelper } from '../../../database/transaction.helper';
import { DomainEventEmitter } from '../../../events/domain-event-emitter.service';
import { StripeService } from '../../stripe/stripe.service';
import { PlatformFeeService } from '../../platform-fee/platform-fee.service';
import {
  createMockRepository,
  createMockEventEmitter,
  createMockStripeService,
  createMockPlatformFeeService,
} from '../../../../test/helpers/test-factory';

describe('SubscriptionWebhookHandlerService', () => {
  let service: SubscriptionWebhookHandlerService;
  let module: TestingModule;
  let paymentRepo: any;
  let transactionRepo: any;
  let auditLogRepo: any;
  let selectionRepo: any;
  let jobRepo: any;
  let stripeService: any;
  let transactionHelper: any;
  let eventEmitter: any;
  let mockManagerSave: jest.Mock;
  let mockManagerFindOne: jest.Mock;

  const STRIPE_EVENT_ID = 'evt_test_123';
  const SUBSCRIPTION_ID = 'sub_test_123';
  const INVOICE_ID = 'in_test_123';
  const CHECKOUT_SESSION_ID = 'cs_test_123';
  const STRIPE_CUSTOMER_ID = 'cus_test_123';
  const SELECTION_ID = 'selection-123';
  const SEEKER_ID = 'seeker-123';
  const PROVIDER_ID = 'provider-123';
  const JOB_ID = 'job-123';

  const makeMappingRecord = (overrides = {}) => ({
    subscriptionId: SUBSCRIPTION_ID,
    selectionId: SELECTION_ID,
    durationMonths: 1,
    numberOfPeriods: 1,
    monthlyAmount: 150,
    installmentAmountCents: 15000,
    ...overrides,
  });

  beforeEach(async () => {
    paymentRepo = {
      ...createMockRepository(),
      count: jest.fn().mockResolvedValue(0),
    };

    transactionRepo = {
      ...createMockRepository(),
      createQueryBuilder: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ count: 0 }),
      }),
    };

    auditLogRepo = {
      ...createMockRepository(),
      findOne: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue({
        where:      jest.fn().mockReturnThis(),
        andWhere:   jest.fn().mockReturnThis(),
        orderBy:    jest.fn().mockReturnThis(),
        getCount:   jest.fn().mockResolvedValue(0),
        getOne:     jest.fn().mockResolvedValue(null),
        getRawOne:  jest.fn().mockResolvedValue(null),
      }),
    };

    selectionRepo = {
      ...createMockRepository(),
      findOne: jest.fn(),
    };

    jobRepo = {
      ...createMockRepository(),
      update: jest.fn(),
    };

    stripeService = createMockStripeService();

    eventEmitter = createMockEventEmitter();

    mockManagerSave = jest.fn().mockImplementation((_entity: any, data: any) => ({
      id: 'mock-id',
      ...(data || {}),
    }));
    mockManagerFindOne = jest.fn().mockResolvedValue(null);

    transactionHelper = {
      run: jest.fn().mockImplementation(async (cb: any) =>
        cb({
          manager: {
            create: jest.fn().mockImplementation((_entity: any, data: any) => data),
            save: mockManagerSave,
            findOne: mockManagerFindOne,
            update: jest.fn().mockResolvedValue({ affected: 1 }),
          },
        }),
      ),
    };

    module = await Test.createTestingModule({
      providers: [
        SubscriptionWebhookHandlerService,
        { provide: getRepositoryToken(Payment), useValue: paymentRepo },
        { provide: getRepositoryToken(Transaction), useValue: transactionRepo },
        { provide: getRepositoryToken(AuditLog), useValue: auditLogRepo },
        { provide: getRepositoryToken(Selection), useValue: selectionRepo },
        { provide: getRepositoryToken(Bid), useValue: createMockRepository() },
        { provide: getRepositoryToken(Job), useValue: jobRepo },
        { provide: getRepositoryToken(JobContract), useValue: createMockRepository() },
        { provide: StripeService, useValue: stripeService },
        { provide: PlatformFeeService, useValue: createMockPlatformFeeService() },
        { provide: TransactionHelper, useValue: transactionHelper },
        { provide: DomainEventEmitter, useValue: eventEmitter },
      ],
    }).compile();

    service = module.get<SubscriptionWebhookHandlerService>(SubscriptionWebhookHandlerService);
  });

  afterEach(() => module.close());

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ── isWebhookProcessed ─────────────────────────────────────────────────────

  describe('isWebhookProcessed', () => {
    it('should return true if webhook already processed', async () => {
      auditLogRepo.createQueryBuilder.mockReturnValue({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(1),
      });

      const result = await service.isWebhookProcessed(STRIPE_EVENT_ID);

      expect(result).toBe(true);
    });

    it('should return false if webhook not processed', async () => {
      auditLogRepo.findOne.mockResolvedValue(null);

      const result = await service.isWebhookProcessed(STRIPE_EVENT_ID);

      expect(result).toBe(false);
    });
  });

  // ── markWebhookProcessed ───────────────────────────────────────────────────

  describe('markWebhookProcessed', () => {
    it('should save webhook as processed in AuditLog via queryRunner', async () => {
      const mockSave = jest.fn().mockResolvedValue({});
      const mockQR = { manager: { save: mockSave } };

      await service.markWebhookProcessed(
        STRIPE_EVENT_ID,
        'checkout.session.completed',
        CHECKOUT_SESSION_ID,
        mockQR,
      );

      expect(mockSave).toHaveBeenCalledWith(
        AuditLog,
        expect.objectContaining({
          action: 'STRIPE_WEBHOOK_PROCESSED',
          metadata: expect.objectContaining({ stripeEventId: STRIPE_EVENT_ID }),
        }),
      );
    });
  });

  // ── handleCheckoutSessionCompleted ─────────────────────────────────────────

  describe('handleCheckoutSessionCompleted', () => {
    it('should store subscription mapping in AuditLog and emit event', async () => {
      const session = {
        id: CHECKOUT_SESSION_ID,
        subscription: SUBSCRIPTION_ID,
        customer: STRIPE_CUSTOMER_ID,
        metadata: { selectionId: SELECTION_ID, durationMonths: '1', numberOfPeriods: '1' },
        amount_subtotal: 15000,
        amount_total: 15000,
        currency: 'aud',
      };

      stripeService.getSubscription.mockResolvedValue({
        id: SUBSCRIPTION_ID,
        metadata: { providerId: PROVIDER_ID, seekerId: SEEKER_ID },
      });

      mockManagerFindOne.mockResolvedValue({
        id: SELECTION_ID,
        provider: { id: PROVIDER_ID },
        job: { id: JOB_ID },
      });

      await service.handleCheckoutSessionCompleted(session as any);

      expect(stripeService.getSubscription).toHaveBeenCalledWith(SUBSCRIPTION_ID);
      expect(eventEmitter.emit).toHaveBeenCalled();
    });

    it('should store the job-price amounts from the checkout-created log, not the fee-inclusive session totals', async () => {
      const session = {
        id: CHECKOUT_SESSION_ID,
        subscription: SUBSCRIPTION_ID,
        customer: STRIPE_CUSTOMER_ID,
        metadata: { selectionId: SELECTION_ID, durationMonths: '1', numberOfPeriods: '1' },
        amount_subtotal: 3584, // fee-inclusive (job $32 + fee $3.84) — must NOT drive the mapping
        amount_total: 3584,
        currency: 'aud',
      };

      stripeService.getSubscription.mockResolvedValue({
        id: SUBSCRIPTION_ID,
        metadata: { providerId: PROVIDER_ID, seekerId: SEEKER_ID },
      });

      // Selection lookup → the selection; AuditLog lookup → the checkout-created log with job-price
      // amounts ($32); Subscription lookup → none.
      mockManagerFindOne.mockImplementation(async (entity: any) => {
        if (entity === Selection) return { id: SELECTION_ID, provider: { id: PROVIDER_ID }, job: { id: JOB_ID } };
        if (entity === AuditLog) return { metadata: { installmentAmount: 32, totalAmount: 32, monthlyAmount: 32 } };
        return null;
      });

      await service.handleCheckoutSessionCompleted(session as any);

      const mappingSave = mockManagerSave.mock.calls.find(
        ([, data]: any[]) => data?.action === 'STRIPE_SUBSCRIPTION_MAPPING',
      );
      expect(mappingSave).toBeDefined();
      expect(mappingSave![1].metadata).toMatchObject({ installmentAmount: 32, totalAmount: 32, monthlyAmount: 32 });
    });

    it('should throw when selectionId is missing from metadata', async () => {
      const session = {
        id: CHECKOUT_SESSION_ID,
        subscription: SUBSCRIPTION_ID,
        customer: STRIPE_CUSTOMER_ID,
        metadata: {},
      };

      stripeService.getSubscription.mockResolvedValue({ id: SUBSCRIPTION_ID, metadata: {} });

      await expect(service.handleCheckoutSessionCompleted(session as any)).rejects.toThrow();
    });
  });

  // ── handleInvoicePaid ──────────────────────────────────────────────────────

  describe('handleInvoicePaid', () => {
    const makeInvoice = (overrides = {}) => ({
      id: INVOICE_ID,
      subscription: SUBSCRIPTION_ID,
      customer: STRIPE_CUSTOMER_ID,
      amount_paid: 15000,
      amount_due: 15000,
      status: 'paid',
      currency: 'aud',
      payment_intent: 'pi_test_123',
      ...overrides,
    });

    beforeEach(() => {
      // Mapping record for getSubscriptionMapping (uses createQueryBuilder, not findOne)
      auditLogRepo.createQueryBuilder.mockReturnValue({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(0),
        getOne: jest.fn().mockResolvedValue({
          id: 'audit-mapping',
          metadata: makeMappingRecord(),
        }),
        getRawOne: jest.fn().mockResolvedValue(null),
      });

      selectionRepo.findOne.mockResolvedValue({
        id: SELECTION_ID,
        job: { id: JOB_ID, seeker: { id: SEEKER_ID } },
        provider: { id: PROVIDER_ID },
      });

      paymentRepo.findOne.mockResolvedValue(null); // not yet processed
    });

    it('should create Transaction record and emit event', async () => {
      await service.handleInvoicePaid(makeInvoice());

      expect(transactionHelper.run).toHaveBeenCalled();
      expect(eventEmitter.emit).toHaveBeenCalled();
    });

    it('should schedule subscription cancellation on final payment cycle', async () => {
      // countPaidCycles (via transactionRepo.count) returns 0 → paidCycles = 1 → isLastCycle (numberOfPeriods=1)
      transactionRepo.count.mockResolvedValue(0);

      const pendingPayment = { id: 'payment-1', amount: 15000, status: 'PENDING' };
      mockManagerFindOne.mockResolvedValue(pendingPayment);

      await service.handleInvoicePaid(makeInvoice());

      expect(stripeService.cancelSubscriptionAtPeriodEnd).toHaveBeenCalledWith(SUBSCRIPTION_ID);
    });

    it('should not cancel subscription if duration not reached', async () => {
      auditLogRepo.createQueryBuilder.mockReturnValue({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(0),
        getOne: jest.fn().mockResolvedValue({
          id: 'audit-mapping',
          metadata: makeMappingRecord({ durationMonths: 3, numberOfPeriods: 3 }),
        }),
        getRawOne: jest.fn().mockResolvedValue(null),
      });

      // 0 paid cycles before → paidCycles = 1, numberOfPeriods = 3 → not last
      transactionRepo.count.mockResolvedValue(0);

      await service.handleInvoicePaid(makeInvoice());

      expect(stripeService.cancelSubscriptionAtPeriodEnd).not.toHaveBeenCalled();
    });

    it('should skip if invoice already processed (idempotency)', async () => {
      // Idempotency is checked against the Transaction ledger (by invoice/PI id), not Payment.
      transactionRepo.findOne.mockResolvedValue({ id: 'txn-existing' });

      await service.handleInvoicePaid(makeInvoice());

      expect(transactionHelper.run).not.toHaveBeenCalled();
    });
  });

  // ── handleInvoicePaymentFailed ─────────────────────────────────────────────

  describe('handleInvoicePaymentFailed', () => {
    it('should log failure and emit event', async () => {
      const invoice = {
        id: INVOICE_ID,
        subscription: SUBSCRIPTION_ID,
        customer: STRIPE_CUSTOMER_ID,
        amount_due: 15000,
      };

      auditLogRepo.createQueryBuilder.mockReturnValue({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(0),
        getOne: jest.fn().mockResolvedValue({
          metadata: makeMappingRecord(),
        }),
        getRawOne: jest.fn().mockResolvedValue(null),
      });

      await service.handleInvoicePaymentFailed(invoice);

      expect(transactionHelper.run).toHaveBeenCalled();
      expect(eventEmitter.emit).toHaveBeenCalled();
    });

    it('should return early when selection cannot be resolved', async () => {
      const invoice = {
        id: INVOICE_ID,
        subscription: SUBSCRIPTION_ID,
        customer: STRIPE_CUSTOMER_ID,
        amount_due: 15000,
      };

      auditLogRepo.findOne.mockResolvedValue(null); // no mapping → no selectionId

      await service.handleInvoicePaymentFailed(invoice);

      expect(transactionHelper.run).not.toHaveBeenCalled();
    });
  });

  // ── handleSubscriptionUpdated ──────────────────────────────────────────────

  describe('handleSubscriptionUpdated', () => {
    it('should sync subscription status to AuditLog', async () => {
      const subscription = {
        id: SUBSCRIPTION_ID,
        status: 'active',
        current_period_end: Math.floor(Date.now() / 1000) + 86400,
      };

      auditLogRepo.createQueryBuilder.mockReturnValue({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(0),
        getOne: jest.fn().mockResolvedValue({
          metadata: makeMappingRecord(),
        }),
        getRawOne: jest.fn().mockResolvedValue(null),
      });

      await service.handleSubscriptionUpdated(subscription);

      expect(transactionHelper.run).toHaveBeenCalled();
    });

    it('should return early when selection cannot be resolved', async () => {
      const subscription = { id: SUBSCRIPTION_ID, status: 'active' };

      auditLogRepo.findOne.mockResolvedValue(null);

      await service.handleSubscriptionUpdated(subscription);

      expect(transactionHelper.run).not.toHaveBeenCalled();
    });
  });

  // ── handleSubscriptionDeleted ──────────────────────────────────────────────

  describe('handleSubscriptionDeleted', () => {
    const makeSubscription = () => ({ id: SUBSCRIPTION_ID, status: 'canceled' });

    beforeEach(() => {
      auditLogRepo.findOne.mockResolvedValue({
        metadata: makeMappingRecord(),
      });

      transactionRepo.createQueryBuilder.mockReturnValue({
        where: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ count: 1 }),
      });

      const jobObj = { id: JOB_ID, status: 'ACTIVE' };
      mockManagerFindOne.mockResolvedValue({
        id: SELECTION_ID,
        job: jobObj,
        provider: { id: PROVIDER_ID },
      });
      mockManagerSave.mockImplementation((_entity: any, obj: any) => obj);
    });

    it('should finalize job as completed after full duration', async () => {
      // paidCycles (1) >= durationMonths (1) → completed
      auditLogRepo.createQueryBuilder.mockReturnValue({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(0),
        getOne: jest.fn().mockResolvedValue({
          metadata: makeMappingRecord(),
        }),
        getRawOne: jest.fn().mockResolvedValue(null),
      });

      await service.handleSubscriptionDeleted(makeSubscription());

      expect(eventEmitter.emit).toHaveBeenCalled();
    });

    it('should finalize job as cancelled if duration not reached', async () => {
      auditLogRepo.createQueryBuilder.mockReturnValue({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(0),
        getOne: jest.fn().mockResolvedValue({
          metadata: makeMappingRecord({ durationMonths: 3, numberOfPeriods: 3 }),
        }),
        getRawOne: jest.fn().mockResolvedValue(null),
      });

      // paidCycles = 0 < durationMonths 3 → cancelled
      transactionRepo.createQueryBuilder.mockReturnValue({
        where: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ count: 0 }),
      });

      await service.handleSubscriptionDeleted(makeSubscription());

      expect(eventEmitter.emit).toHaveBeenCalled();
    });

    it('should return early when selection cannot be resolved', async () => {
      auditLogRepo.findOne.mockResolvedValue(null);

      await service.handleSubscriptionDeleted(makeSubscription());

      expect(transactionHelper.run).not.toHaveBeenCalled();
    });
  });

  // ── countPaidCycles (private) ──────────────────────────────────────────────

  describe('countPaidCycles', () => {
    it('should count paid subscription cycles via repository.count', async () => {
      transactionRepo.count.mockResolvedValue(2);

      const result = await (service as any).countPaidCycles(SUBSCRIPTION_ID);

      expect(transactionRepo.count).toHaveBeenCalledWith({
        where: { stripeSubscriptionId: SUBSCRIPTION_ID },
      });
      expect(result).toBe(2);
    });

    it('should return 0 if no paid cycles found', async () => {
      transactionRepo.count.mockResolvedValue(0);

      const result = await (service as any).countPaidCycles(SUBSCRIPTION_ID);

      expect(result).toBe(0);
    });
  });
});
