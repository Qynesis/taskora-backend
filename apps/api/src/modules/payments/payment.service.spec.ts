import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PaymentService } from './payment.service';
import { Payment } from '../../database/entities/payment.entity';
import { AuditLog, Job, JobContract, Selection, StripeAccount, StripeCustomer, User } from '../../database';
import { Refund } from '../../database/entities/refund.entity';
import { RefundRequest } from '../../database/entities/refund-request.entity';
import { SavedPaymentMethod } from '../../database/entities/saved-payment-method.entity';
import { Transaction } from '../../database/entities/transaction.entity';
import { Subscription } from '../../database/entities/subscription.entity';
import { TransactionHelper } from '../../database/transaction.helper';
import { DomainEventEmitter } from '../../events/domain-event-emitter.service';
import { StripeService } from '../stripe/stripe.service';
import { PlatformFeeService } from '../platform-fee/platform-fee.service';
import { AppCacheService } from '../../cache/cache.service';
import { GetConnectStatusDto } from './dto/payment-request.dto';
import {
  createMockRepository,
  createMockTransactionHelper,
  createMockEventEmitter,
  createMockStripeService,
  createMockPlatformFeeService,
} from '../../../test/helpers/test-factory';

const USER_ID = '00000000-0000-0000-0000-000000000001';
const PROVIDER_ID = '00000000-0000-0000-0000-000000000002';
const STRIPE_ACCOUNT_ID = 'acct_test123';
const CUSTOMER_ID = 'cus_test123';
const PAYMENT_INTENT_ID = 'pi_test123';

describe('PaymentService', () => {
  let module: TestingModule;
  let service: PaymentService;
  let paymentRepo: ReturnType<typeof createMockRepository> & { exists: jest.Mock };
  let transactionRepo: ReturnType<typeof createMockRepository> & { createQueryBuilder: jest.Mock };
  let subscriptionRepo: ReturnType<typeof createMockRepository>;
  let stripeAccountRepo: ReturnType<typeof createMockRepository>;
  let userRepo: ReturnType<typeof createMockRepository>;
  let stripeCustomerRepo: ReturnType<typeof createMockRepository>;
  let jobRepo: ReturnType<typeof createMockRepository>;
  let savedPaymentMethodRepo: ReturnType<typeof createMockRepository>;
  let selectionRepo: ReturnType<typeof createMockRepository>;
  let auditLogRepo: ReturnType<typeof createMockRepository>;
  let refundRepo: ReturnType<typeof createMockRepository>;
  let refundRequestRepo: ReturnType<typeof createMockRepository>;
  let jobContractRepo: ReturnType<typeof createMockRepository>;
  let stripeService: ReturnType<typeof createMockStripeService>;
  let txHelper: ReturnType<typeof createMockTransactionHelper>;

  beforeEach(async () => {
    paymentRepo = {
      ...createMockRepository(),
      exists: jest.fn(),
    } as any;
    transactionRepo = {
      ...createMockRepository(),
      createQueryBuilder: jest.fn().mockReturnValue({
        innerJoin: jest.fn().mockReturnThis(),
        leftJoin: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ totalEarnings: 0 }),
        getRawMany: jest.fn().mockResolvedValue([]),
      }),
    } as any;
    subscriptionRepo = createMockRepository();
    stripeAccountRepo = createMockRepository();
    userRepo = createMockRepository();
    stripeCustomerRepo = createMockRepository();
    jobRepo = createMockRepository();
    savedPaymentMethodRepo = createMockRepository();
    selectionRepo = createMockRepository();
    auditLogRepo = createMockRepository();
    refundRepo = createMockRepository();
    refundRequestRepo = createMockRepository();
    jobContractRepo = createMockRepository();
    stripeService = createMockStripeService();
    txHelper = createMockTransactionHelper();

    module = await Test.createTestingModule({
      providers: [
        PaymentService,
        { provide: getRepositoryToken(Payment), useValue: paymentRepo },
        { provide: getRepositoryToken(Refund), useValue: refundRepo },
        { provide: getRepositoryToken(RefundRequest), useValue: refundRequestRepo },
        { provide: getRepositoryToken(Transaction), useValue: transactionRepo },
        { provide: getRepositoryToken(Subscription), useValue: subscriptionRepo },
        { provide: getRepositoryToken(StripeAccount), useValue: stripeAccountRepo },
        { provide: getRepositoryToken(User), useValue: userRepo },
        { provide: getRepositoryToken(StripeCustomer), useValue: stripeCustomerRepo },
        { provide: getRepositoryToken(Job), useValue: jobRepo },
        { provide: getRepositoryToken(SavedPaymentMethod), useValue: savedPaymentMethodRepo },
        { provide: getRepositoryToken(Selection), useValue: selectionRepo },
        { provide: getRepositoryToken(AuditLog), useValue: auditLogRepo },
        { provide: getRepositoryToken(JobContract), useValue: jobContractRepo },
        { provide: ConfigService, useValue: { get: jest.fn() } },
        { provide: TransactionHelper, useValue: txHelper },
        { provide: DomainEventEmitter, useValue: createMockEventEmitter() },
        { provide: StripeService, useValue: stripeService },
        { provide: PlatformFeeService, useValue: createMockPlatformFeeService() },
        { provide: AppCacheService, useValue: { delByPrefix: jest.fn(), del: jest.fn() } },
      ],
    }).compile();

    service = module.get<PaymentService>(PaymentService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => module.close());

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ── getConnectStatus ───────────────────────────────────────────────────────

  describe('getConnectStatus', () => {
    it('should throw BadRequestException when stripe account not found', async () => {
      stripeAccountRepo.findOne.mockResolvedValue(null);

      await expect(
        service.getConnectStatus({ id: USER_ID } as GetConnectStatusDto),
      ).rejects.toThrow(BadRequestException);
    });

    it('should return connect status when stripe account exists', async () => {
      stripeAccountRepo.findOne.mockResolvedValue({ accountId: STRIPE_ACCOUNT_ID });
      stripeService.retrieveConnectedAccount.mockResolvedValue({
        id: STRIPE_ACCOUNT_ID,
        details_submitted: true,
        charges_enabled: true,
        payouts_enabled: true,
        requirements: { currently_due: [], eventually_due: [] },
      });

      const result = await service.getConnectStatus({ id: USER_ID } as GetConnectStatusDto);

      expect(stripeService.retrieveConnectedAccount).toHaveBeenCalledWith(STRIPE_ACCOUNT_ID);
      expect(result.chargesEnabled).toBe(true);
    });
  });

  // ── getPaymentDetails ──────────────────────────────────────────────────────

  describe('getPaymentDetails', () => {
    // Access is now verified via the Transaction ledger (stripePaymentIntentId → payment →
    // seeker/provider), not a direct Payment lookup.
    const makeTxnWithAccess = (overrides: object = {}) => ({
      payment: { seeker: { id: USER_ID }, provider: { id: PROVIDER_ID } },
      ...overrides,
    });

    it('should throw NotFoundException when requester has no access to the payment intent', async () => {
      transactionRepo.findOne.mockResolvedValue(null);
      stripeService.getPaymentDetails.mockResolvedValue({ id: PAYMENT_INTENT_ID });

      await expect(service.getPaymentDetails(PAYMENT_INTENT_ID, USER_ID, ['SEEKER'])).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when payment details not found', async () => {
      transactionRepo.findOne.mockResolvedValue(makeTxnWithAccess());
      stripeService.getPaymentDetails.mockResolvedValue(null);

      await expect(service.getPaymentDetails(PAYMENT_INTENT_ID, USER_ID, ['SEEKER'])).rejects.toThrow(NotFoundException);
    });

    it('should return payment details when found', async () => {
      const details = { id: PAYMENT_INTENT_ID, amount: 10000, currency: 'aud', status: 'succeeded' };
      transactionRepo.findOne.mockResolvedValue(makeTxnWithAccess());
      stripeService.getPaymentDetails.mockResolvedValue(details);

      const result = await service.getPaymentDetails(PAYMENT_INTENT_ID, USER_ID, ['SEEKER']);

      expect(result.id).toBe(PAYMENT_INTENT_ID);
    });

    it('should skip the access check for admins', async () => {
      const details = { id: PAYMENT_INTENT_ID, amount: 10000, currency: 'aud', status: 'succeeded' };
      stripeService.getPaymentDetails.mockResolvedValue(details);

      const result = await service.getPaymentDetails(PAYMENT_INTENT_ID, 'admin-id', ['ADMIN']);

      expect(transactionRepo.findOne).not.toHaveBeenCalled();
      expect(result.id).toBe(PAYMENT_INTENT_ID);
    });
  });

  // ── processRefund ──────────────────────────────────────────────────────────

  describe('processRefund', () => {
    const PAYMENT_ID = '00000000-0000-0000-0000-000000000010';
    const CHARGE_ID = 'ch_test123';

    const makePayment = (overrides: object = {}) => ({
      id: PAYMENT_ID,
      status: 'succeeded',
      isSubscription: false,
      job: {
        provider: { id: PROVIDER_ID },
      },
      ...overrides,
    });

    // Chargeable Stripe transactions are looked up from the ledger, not payment.stripeChargeId.
    const makeChargeableTxn = (overrides: object = {}) => ({
      stripeChargeId: CHARGE_ID,
      stripeInvoiceId: null,
      amount: 150,
      ...overrides,
    });

    const makeRefundRequest = (overrides: object = {}) => ({
      id: 'rr-1',
      requestedAmount: 150,   // dollars — e.g. $150.00 AUD
      reason: 'poor_service_quality',
      status: 'pending',
      ...overrides,
    });

    beforeEach(() => {
      // Default: one chargeable single-task transaction, no pending refund request yet.
      transactionRepo.find.mockResolvedValue([makeChargeableTxn()]);
    });

    it('should throw NotFoundException when payment not found', async () => {
      paymentRepo.findOne.mockResolvedValue(null);

      await expect(service.processRefund(PAYMENT_ID, PROVIDER_ID)).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when provider does not own the job', async () => {
      paymentRepo.findOne.mockResolvedValue(makePayment({
        job: { provider: { id: 'other-provider' } },
      }));

      await expect(service.processRefund(PAYMENT_ID, PROVIDER_ID)).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException when payment is not in succeeded state', async () => {
      paymentRepo.findOne.mockResolvedValue(makePayment({ status: 'refunded' }));

      await expect(service.processRefund(PAYMENT_ID, PROVIDER_ID)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when payment has no chargeable transactions', async () => {
      paymentRepo.findOne.mockResolvedValue(makePayment());
      transactionRepo.find.mockResolvedValue([{ ...makeChargeableTxn(), stripeChargeId: null }]);

      await expect(service.processRefund(PAYMENT_ID, PROVIDER_ID)).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when no pending refund request exists', async () => {
      paymentRepo.findOne.mockResolvedValue(makePayment());
      refundRequestRepo.findOne.mockResolvedValue(null);

      await expect(service.processRefund(PAYMENT_ID, PROVIDER_ID)).rejects.toThrow(NotFoundException);
    });

    it('should call stripe createRefund with cents and return amount in dollars', async () => {
      paymentRepo.findOne.mockResolvedValue(makePayment());
      // requestedAmount = 150 dollars; the 10% admin fee ($15) is deducted → refund $135
      refundRequestRepo.findOne.mockResolvedValue(makeRefundRequest());
      // Stripe returns amount in cents
      stripeService.createRefund.mockResolvedValue({
        id: 're_test123',
        amount: 13500,   // Stripe returns 13500 cents = $135.00 (150 − 15 admin fee)
        status: 'succeeded',
      } as any);

      const result = await service.processRefund(PAYMENT_ID, PROVIDER_ID);

      // must convert dollars → cents before calling Stripe, keyed by request + charge id
      expect(stripeService.createRefund).toHaveBeenCalledWith(
        CHARGE_ID,
        13500,           // (150 − 15 admin fee) * 100 = 13500 cents
        'poor_service_quality',
        `refund:rr-1:${CHARGE_ID}`,
      );
      expect(result.stripeRefundId).toBe('re_test123');
      expect(result.amount).toBe(135);    // 13500 cents → $135 dollars
      expect(result.status).toBe('succeeded');
    });

    it('should store Refund.amount in dollars (Stripe cents divided by 100)', async () => {
      paymentRepo.findOne.mockResolvedValue(makePayment());
      refundRequestRepo.findOne.mockResolvedValue(makeRefundRequest({ requestedAmount: 100.04 }));
      stripeService.createRefund.mockResolvedValue({
        id: 're_decimal',
        amount: 9004,    // Stripe returns 9004 cents = $90.04 (100.04 − 10 admin fee)
        status: 'succeeded',
      } as any);

      const result = await service.processRefund(PAYMENT_ID, PROVIDER_ID);

      // We verify via stripeService args: (100.04 − 10 admin fee) → 9004 cents, and the returned dollars.
      expect(stripeService.createRefund).toHaveBeenCalledWith(
        CHARGE_ID,
        9004,
        'poor_service_quality',
        `refund:rr-1:${CHARGE_ID}`,
      );
      expect(result.amount).toBe(90.04);
    });

    it('should allow access when provider is set via provider relation', async () => {
      paymentRepo.findOne.mockResolvedValue(makePayment({
        job: { provider: { id: PROVIDER_ID } },
      }));
      refundRequestRepo.findOne.mockResolvedValue(makeRefundRequest());
      stripeService.createRefund.mockResolvedValue({ id: 're_test456', amount: 13500, status: 'succeeded' } as any);

      const result = await service.processRefund(PAYMENT_ID, PROVIDER_ID);

      expect(result.stripeRefundId).toBe('re_test456');
      expect(result.amount).toBe(135);  // 13500 cents → $135 dollars (150 − 15 admin fee)
    });
  });

  // ── initiateJobCheckout ────────────────────────────────────────────────────

  describe('initiateJobCheckout', () => {
    it('should reject checkout for a cancelled job before any Stripe work', async () => {
      jobRepo.findOne.mockResolvedValue({
        id: 'job-1',
        status: 'cancelled',
        seeker: { id: USER_ID },
        selectedBid: { price: 100 },
        provider: { id: PROVIDER_ID },
      } as any);

      await expect(service.initiateJobCheckout('job-1', USER_ID)).rejects.toThrow(BadRequestException);
      // Short-circuits before touching Stripe (the account lookup is the first Stripe-side step).
      expect(stripeAccountRepo.findOne).not.toHaveBeenCalled();
    });
  });

  // ── getProviderPayments ────────────────────────────────────────────────────

  describe('getProviderPayments', () => {
    const baseQuery = (extra: object = {}) =>
      ({ page: 1, limit: 10, order: 'DESC' as const, ...extra } as any);

    const makePaymentRow = (overrides: object = {}) => ({
      id: 'pay-1',
      job: { id: 'job-1', title: 'Fix kitchen sink' },
      seeker: { email: 'jane@test.com', profile: { firstName: 'Jane', lastName: 'Smith' } },
      providerAmount: 97,
      currency: 'AUD',
      status: 'succeeded',
      hostedInvoiceUrl: 'https://pay.stripe.com/receipts/test',
      createdAt: new Date('2026-05-10T08:30:00Z'),
      ...overrides,
    });

    const makeMainQb = (rows: any[]) => ({
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue([rows, rows.length]),
    });

    const makeManagerQb = (rows: any[] = []) => ({
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      from: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getRawMany: jest.fn().mockResolvedValue(rows),
    });

    beforeEach(() => {
      // amount now = SUM(transaction.provider_payout) per payment, from the ledger.
      (transactionRepo as any).createQueryBuilder = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([{ paymentId: 'pay-1', payout: 97 }]),
      });
    });

    it('should return paginated payment list with succeeded mapped to paid', async () => {
      (paymentRepo as any).createQueryBuilder = jest.fn().mockReturnValue(makeMainQb([makePaymentRow()]));
      (paymentRepo as any).manager = { createQueryBuilder: jest.fn().mockReturnValue(makeManagerQb()) };

      const result = await service.getProviderPayments(PROVIDER_ID, baseQuery());

      expect(result.total).toBe(1);
      expect(result.items[0].status).toBe('paid');
      expect(result.items[0].jobTitle).toBe('Fix kitchen sink');
      expect(result.items[0].clientName).toBe('Jane Smith');
      expect(result.items[0].amount).toBe(97);
    });

    it('should exclude never-paid cancelled jobs (CANCELED payment with no PAYMENT txn)', async () => {
      const mainQb = makeMainQb([]);
      (paymentRepo as any).createQueryBuilder = jest.fn().mockReturnValue(mainQb);
      (paymentRepo as any).manager = { createQueryBuilder: jest.fn().mockReturnValue(makeManagerQb()) };

      await service.getProviderPayments(PROVIDER_ID, baseQuery());

      expect(mainQb.andWhere).toHaveBeenCalledWith(
        expect.stringContaining('SELECT 1 FROM transactions t'),
        { canceledStatus: 'canceled', paymentTxnType: 'payment' },
      );
    });

    it('should include jobId in the response', async () => {
      (paymentRepo as any).createQueryBuilder = jest.fn().mockReturnValue(makeMainQb([makePaymentRow()]));
      (paymentRepo as any).manager = { createQueryBuilder: jest.fn().mockReturnValue(makeManagerQb()) };

      const result = await service.getProviderPayments(PROVIDER_ID, baseQuery());

      expect(result.items[0].jobId).toBe('job-1');
    });

    it('should return null jobId when payment has no associated job', async () => {
      (paymentRepo as any).createQueryBuilder = jest.fn().mockReturnValue(makeMainQb([makePaymentRow({ job: null })]));
      (paymentRepo as any).manager = { createQueryBuilder: jest.fn().mockReturnValue(makeManagerQb()) };

      const result = await service.getProviderPayments(PROVIDER_ID, baseQuery());

      expect(result.items[0].jobId).toBeNull();
    });

    it('should return invoiceUrl for succeeded payments', async () => {
      (paymentRepo as any).createQueryBuilder = jest.fn().mockReturnValue(makeMainQb([makePaymentRow()]));
      (paymentRepo as any).manager = { createQueryBuilder: jest.fn().mockReturnValue(makeManagerQb()) };

      const result = await service.getProviderPayments(PROVIDER_ID, baseQuery());

      expect(result.items[0].invoiceUrl).toBe('https://pay.stripe.com/receipts/test');
    });

    it('should return null invoiceUrl for pending payments', async () => {
      const row = makePaymentRow({ status: 'pending', hostedInvoiceUrl: 'https://pay.stripe.com/receipts/test' });
      (paymentRepo as any).createQueryBuilder = jest.fn().mockReturnValue(makeMainQb([row]));
      (paymentRepo as any).manager = { createQueryBuilder: jest.fn().mockReturnValue(makeManagerQb()) };

      const result = await service.getProviderPayments(PROVIDER_ID, baseQuery());

      expect(result.items[0].status).toBe('pending');
      expect(result.items[0].invoiceUrl).toBeNull();
    });

    it('should return null invoiceUrl for refunded payments', async () => {
      const row = makePaymentRow({ status: 'refunded', hostedInvoiceUrl: 'https://pay.stripe.com/receipts/test' });
      const managerQb = makeManagerQb([{ paymentId: 'pay-1', refundId: 'ref-1' }]);
      (paymentRepo as any).createQueryBuilder = jest.fn().mockReturnValue(makeMainQb([row]));
      (paymentRepo as any).manager = { createQueryBuilder: jest.fn().mockReturnValue(managerQb) };

      const result = await service.getProviderPayments(PROVIDER_ID, baseQuery());

      expect(result.items[0].invoiceUrl).toBeNull();
    });

    it('should return refundId for refunded payments', async () => {
      const row = makePaymentRow({ status: 'refunded' });
      const managerQb = makeManagerQb([{ paymentId: 'pay-1', refundId: 'ref-abc' }]);
      (paymentRepo as any).createQueryBuilder = jest.fn().mockReturnValue(makeMainQb([row]));
      (paymentRepo as any).manager = { createQueryBuilder: jest.fn().mockReturnValue(managerQb) };

      const result = await service.getProviderPayments(PROVIDER_ID, baseQuery());

      expect(result.items[0].refundId).toBe('ref-abc');
    });

    it('should return null refundId for succeeded payments', async () => {
      (paymentRepo as any).createQueryBuilder = jest.fn().mockReturnValue(makeMainQb([makePaymentRow()]));
      (paymentRepo as any).manager = { createQueryBuilder: jest.fn().mockReturnValue(makeManagerQb()) };

      const result = await service.getProviderPayments(PROVIDER_ID, baseQuery());

      expect(result.items[0].refundId).toBeNull();
    });

    it('should return null refundId for pending payments', async () => {
      (paymentRepo as any).createQueryBuilder = jest.fn().mockReturnValue(makeMainQb([makePaymentRow({ status: 'pending' })]));
      (paymentRepo as any).manager = { createQueryBuilder: jest.fn().mockReturnValue(makeManagerQb()) };

      const result = await service.getProviderPayments(PROVIDER_ID, baseQuery());

      expect(result.items[0].refundId).toBeNull();
    });

    it('should use the latest refund when a payment has multiple refunds', async () => {
      const row = makePaymentRow({ status: 'refunded' });
      // manager returns rows ordered DESC by created_at — first row is the latest
      const managerQb = makeManagerQb([
        { paymentId: 'pay-1', refundId: 'ref-latest' },
        { paymentId: 'pay-1', refundId: 'ref-older' },
      ]);
      (paymentRepo as any).createQueryBuilder = jest.fn().mockReturnValue(makeMainQb([row]));
      (paymentRepo as any).manager = { createQueryBuilder: jest.fn().mockReturnValue(managerQb) };

      const result = await service.getProviderPayments(PROVIDER_ID, baseQuery());

      expect(result.items[0].refundId).toBe('ref-latest');
    });

    it('should not query refunds table when no payments are refunded', async () => {
      const managerQb = makeManagerQb();
      (paymentRepo as any).createQueryBuilder = jest.fn().mockReturnValue(makeMainQb([makePaymentRow()]));
      (paymentRepo as any).manager = { createQueryBuilder: jest.fn().mockReturnValue(managerQb) };

      await service.getProviderPayments(PROVIDER_ID, baseQuery());

      expect((paymentRepo as any).manager.createQueryBuilder).not.toHaveBeenCalled();
    });

    it('should apply status filter — paid translates to succeeded in DB query', async () => {
      const qb = makeMainQb([makePaymentRow()]) as any;
      (paymentRepo as any).createQueryBuilder = jest.fn().mockReturnValue(qb);
      (paymentRepo as any).manager = { createQueryBuilder: jest.fn().mockReturnValue(makeManagerQb()) };

      await service.getProviderPayments(PROVIDER_ID, baseQuery({ status: 'paid' }));

      const andWhereCalls = qb.andWhere.mock.calls as [string, any][];
      expect(andWhereCalls.some((args) => (args[1] as any)?.status === 'succeeded')).toBe(true);
    });

    it('should apply status filter — pending passes through unchanged', async () => {
      const qb = makeMainQb([]) as any;
      (paymentRepo as any).createQueryBuilder = jest.fn().mockReturnValue(qb);
      (paymentRepo as any).manager = { createQueryBuilder: jest.fn().mockReturnValue(makeManagerQb()) };

      await service.getProviderPayments(PROVIDER_ID, baseQuery({ status: 'pending' }));

      const andWhereCalls = qb.andWhere.mock.calls as [string, any][];
      expect(andWhereCalls.some((args) => (args[1] as any)?.status === 'pending')).toBe(true);
    });

    it('should fall back to email when seeker profile name is absent', async () => {
      const row = makePaymentRow({ seeker: { email: 'noprofile@test.com', profile: null } });
      (paymentRepo as any).createQueryBuilder = jest.fn().mockReturnValue(makeMainQb([row]));
      (paymentRepo as any).manager = { createQueryBuilder: jest.fn().mockReturnValue(makeManagerQb()) };

      const result = await service.getProviderPayments(PROVIDER_ID, baseQuery());

      expect(result.items[0].clientName).toBe('noprofile@test.com');
    });

    it('should return empty page when no payments exist', async () => {
      (paymentRepo as any).createQueryBuilder = jest.fn().mockReturnValue(makeMainQb([]));
      (paymentRepo as any).manager = { createQueryBuilder: jest.fn().mockReturnValue(makeManagerQb()) };

      const result = await service.getProviderPayments(PROVIDER_ID, baseQuery());

      expect(result.total).toBe(0);
      expect(result.items).toHaveLength(0);
    });
  });

  // ── getProviderEarningsSummary ─────────────────────────────────────────────
  // Three independent sources: transactionRepo qb (totalEarnings, actual ledger payouts),
  // paymentRepo.manager.query raw SQL (totalPending, expected minus already-paid), and
  // paymentRepo qb (totalRefunded, sum of linked refunds).

  describe('getProviderEarningsSummary', () => {
    const makeEarningsQb = (rawOne: object | null) => ({
      select: jest.fn().mockReturnThis(),
      innerJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getRawOne: jest.fn().mockResolvedValue(rawOne),
    });

    const makeRefundedQb = (rawOne: object | null) => ({
      select: jest.fn().mockReturnThis(),
      innerJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getRawOne: jest.fn().mockResolvedValue(rawOne),
    });

    const setup = (opts: { earnings: object | null; pending: string; refunded: object | null }) => {
      (transactionRepo as any).createQueryBuilder = jest.fn().mockReturnValue(makeEarningsQb(opts.earnings));
      (paymentRepo as any).manager = { query: jest.fn().mockResolvedValue([{ totalPending: opts.pending }]) };
      (paymentRepo as any).createQueryBuilder = jest.fn().mockReturnValue(makeRefundedQb(opts.refunded));
    };

    it('should return correct totals from aggregation', async () => {
      setup({
        earnings: { totalEarnings: '125000' },
        pending: '20000',
        refunded: { totalRefunded: '5000' },
      });

      const result = await service.getProviderEarningsSummary(PROVIDER_ID);

      expect(result.totalEarnings).toBe(125000);
      expect(result.totalPending).toBe(20000);
      expect(result.totalRefunded).toBe(5000);
      expect(result.currency).toBe('AUD');
    });

    it('should return zeros and default currency when no payments exist', async () => {
      setup({
        earnings: { totalEarnings: '0' },
        pending: '0',
        refunded: { totalRefunded: '0' },
      });

      const result = await service.getProviderEarningsSummary(PROVIDER_ID);

      expect(result.totalEarnings).toBe(0);
      expect(result.totalPending).toBe(0);
      expect(result.totalRefunded).toBe(0);
      expect(result.currency).toBe('AUD');
    });

    it('should return zeros when getRawOne returns null', async () => {
      setup({ earnings: null, pending: '0', refunded: null });

      const result = await service.getProviderEarningsSummary(PROVIDER_ID);

      expect(result.totalEarnings).toBe(0);
      expect(result.totalPending).toBe(0);
      expect(result.totalRefunded).toBe(0);
      expect(result.currency).toBe('AUD');
    });
  });
});
