import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { SubscriptionService } from './subscription.service';
import { StripeService } from '../stripe/stripe.service';
import { Subscription } from '../../database/entities/subscription.entity';
import { Selection } from '../../database/entities/selection.entity';
import { StripeAccount } from '../../database/entities/stripe-account.entity';
import { StripeCustomer } from '../../database/entities/stripe-customer.entity';
import { AuditLog } from '../../database/entities/audit-log.entity';
import { Job } from '../../database/entities/job.entity';
import { JobContract } from '../../database/entities/job-contract.entity';
import { Transaction } from '../../database/entities/transaction.entity';
import { SubscriptionCancellationRequest } from '../../database/entities/subscription-cancellation-request.entity';
import { TransactionHelper } from '../../database/transaction.helper';
import { PlatformFeeService } from '../platform-fee/platform-fee.service';
import { AppCacheService } from '../../cache/cache.service';
import {
  createMockRepository,
  createMockTransactionHelper,
  createMockStripeService,
  createMockPlatformFeeService,
} from '../../../test/helpers/test-factory';

const SEEKER_ID = '00000000-0000-0000-0000-000000000001';
const PROVIDER_ID = '00000000-0000-0000-0000-000000000002';
const JOB_ID = 'job-123';
const SELECTION_ID = 'selection-123';
const ACCT_ID = 'acct_test123';
const CUSTOMER_ID = 'cus_test123';

const mockJob = {
  id: JOB_ID,
  seeker: { id: SEEKER_ID },
  selectedBid: { id: 'bid-1', price: 15000 },
  provider: { id: PROVIDER_ID },
  durationMonths: 1,
  currency: 'AUD',
};

const mockContract = {
  id: 'contract-1',
  depositAmount: null,
  paymentFrequency: 'MONTHLY',
};

const mockStripeAccount = {
  id: 'stripe-acc-1',
  accountId: ACCT_ID,
  chargesEnabled: true,
  payoutsEnabled: true,
};

const mockStripeCustomer = {
  id: 'stripe-cust-1',
  customerId: CUSTOMER_ID,
};

describe('SubscriptionService', () => {
  let module: TestingModule;
  let service: SubscriptionService;
  let subscriptionRepo: ReturnType<typeof createMockRepository>;
  let selectionRepo: ReturnType<typeof createMockRepository>;
  let stripeAccountRepo: ReturnType<typeof createMockRepository>;
  let stripeCustomerRepo: ReturnType<typeof createMockRepository>;
  let auditLogRepo: ReturnType<typeof createMockRepository>;
  let jobRepo: ReturnType<typeof createMockRepository>;
  let jobContractRepo: ReturnType<typeof createMockRepository>;
  let transactionRepo: ReturnType<typeof createMockRepository>;
  let cancellationRequestRepo: ReturnType<typeof createMockRepository>;
  let stripeService: ReturnType<typeof createMockStripeService>;
  let transactionHelper: ReturnType<typeof createMockTransactionHelper>;

  beforeEach(async () => {
    subscriptionRepo = createMockRepository();
    selectionRepo = createMockRepository();
    stripeAccountRepo = createMockRepository();
    stripeCustomerRepo = createMockRepository();
    auditLogRepo = createMockRepository();
    jobRepo = createMockRepository();
    jobContractRepo = createMockRepository();
    transactionRepo = createMockRepository();
    cancellationRequestRepo = createMockRepository();
    stripeService = createMockStripeService();
    transactionHelper = createMockTransactionHelper();

    module = await Test.createTestingModule({
      providers: [
        SubscriptionService,
        { provide: getRepositoryToken(Subscription), useValue: subscriptionRepo },
        { provide: getRepositoryToken(Selection), useValue: selectionRepo },
        { provide: getRepositoryToken(StripeAccount), useValue: stripeAccountRepo },
        { provide: getRepositoryToken(StripeCustomer), useValue: stripeCustomerRepo },
        { provide: getRepositoryToken(AuditLog), useValue: auditLogRepo },
        { provide: getRepositoryToken(Job), useValue: jobRepo },
        { provide: getRepositoryToken(JobContract), useValue: jobContractRepo },
        { provide: getRepositoryToken(Transaction), useValue: transactionRepo },
        { provide: getRepositoryToken(SubscriptionCancellationRequest), useValue: cancellationRequestRepo },
        { provide: TransactionHelper, useValue: transactionHelper },
        { provide: StripeService, useValue: stripeService },
        { provide: PlatformFeeService, useValue: createMockPlatformFeeService() },
        { provide: AppCacheService, useValue: { delByPrefix: jest.fn() } },
      ],
    }).compile();

    service = module.get<SubscriptionService>(SubscriptionService);
  });

  afterEach(() => module.close());

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ── initiateJobSubscriptionCheckout ───────────────────────────────────────

  describe('initiateJobSubscriptionCheckout', () => {
    beforeEach(() => {
      jobRepo.findOne.mockResolvedValue(mockJob);
      jobContractRepo.findOne.mockResolvedValue(mockContract);
      selectionRepo.findOne.mockResolvedValue({ id: SELECTION_ID });
      stripeAccountRepo.findOne.mockResolvedValue(mockStripeAccount);
      stripeCustomerRepo.findOne.mockResolvedValue(mockStripeCustomer);
      stripeService.createSubscriptionCheckoutSession.mockResolvedValue({
        url: 'https://checkout.stripe.com/session-123',
        sessionId: 'cs_test_123',
      });
    });

    it('should create a checkout session successfully', async () => {
      const result = await service.initiateJobSubscriptionCheckout(JOB_ID, SEEKER_ID);

      expect(result).toEqual({
        url: 'https://checkout.stripe.com/session-123',
        sessionId: 'cs_test_123',
      });
      expect(stripeService.createSubscriptionCheckoutSession).toHaveBeenCalled();
    });

    it('should throw NotFoundException when job not found', async () => {
      jobRepo.findOne.mockResolvedValue(null);

      await expect(service.initiateJobSubscriptionCheckout(JOB_ID, SEEKER_ID)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException when seeker is not the job owner', async () => {
      jobRepo.findOne.mockResolvedValue({
        ...mockJob,
        seeker: { id: 'different-seeker' },
      });

      await expect(service.initiateJobSubscriptionCheckout(JOB_ID, SEEKER_ID)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException when no selectedBid', async () => {
      jobRepo.findOne.mockResolvedValue({ ...mockJob, selectedBid: null });

      await expect(service.initiateJobSubscriptionCheckout(JOB_ID, SEEKER_ID)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException when no durationMonths', async () => {
      jobRepo.findOne.mockResolvedValue({ ...mockJob, durationMonths: undefined });

      await expect(service.initiateJobSubscriptionCheckout(JOB_ID, SEEKER_ID)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException when contract not found', async () => {
      jobContractRepo.findOne.mockResolvedValue(null);

      await expect(service.initiateJobSubscriptionCheckout(JOB_ID, SEEKER_ID)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException when provider has no Stripe account', async () => {
      stripeAccountRepo.findOne.mockResolvedValue(null);

      await expect(service.initiateJobSubscriptionCheckout(JOB_ID, SEEKER_ID)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should create StripeCustomer if seeker does not have one', async () => {
      stripeCustomerRepo.findOne.mockResolvedValue(null);
      stripeCustomerRepo.create.mockReturnValue({ customerId: 'cus_new' });
      stripeService.create.mockResolvedValue({ id: 'cus_new' });

      const result = await service.initiateJobSubscriptionCheckout(JOB_ID, SEEKER_ID);

      expect(stripeService.create).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should store checkout session mapping in AuditLog', async () => {
      await service.initiateJobSubscriptionCheckout(JOB_ID, SEEKER_ID);

      expect(transactionHelper.run).toHaveBeenCalled();
    });
  });
});
