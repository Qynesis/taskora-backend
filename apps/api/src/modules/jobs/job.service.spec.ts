import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { JobService } from './job.service';
import { Job } from '../../database/entities/job.entity';
import { JobPhoto } from '../../database/entities/job-photo.entity';
import { Payment } from '../../database/entities/payment.entity';
import { Refund } from '../../database/entities/refund.entity';
import { RefundRequest } from '../../database/entities/refund-request.entity';
import { RefundEvidencePhoto } from '../../database/entities/refund-evidence-photo.entity';
import { JobContract } from '../../database/entities/job-contract.entity';
import { Subscription } from '../../database/entities/subscription.entity';
import { Transaction } from '../../database/entities/transaction.entity';
import { Category } from '../../database/entities/category.entity';
import { JobQueryDto } from './dto/job-query.dto';
import { SeekerRequestStatusFilter } from './dto/seekers-job-query.dto';
import { TransactionHelper } from '../../database/transaction.helper';
import { DomainEventEmitter } from '../../events/domain-event-emitter.service';
import { BidStatus, BillingPeriod, ContractPaymentFrequency, JobStatus, JobType, PaymentStatus, RefundEvidenceSide, RefundRequestReason, RefundRequestStatus, ServiceDuration, ServiceFrequency, TransactionType } from '../../database/common/enum';
import { MyServiceStatusFilter } from './dto/my-services-query.dto';
import { ProviderJobStatusTransition } from './dto/provider-job-status.dto';
import { PlatformFeeConfig } from '../../database/entities/platform-fee-config.entity';
import { StripeService } from '../stripe/stripe.service';
import { AppCacheService } from '../../cache/cache.service';
import {
  createMockRepository,
  createMockTransactionHelper,
  createMockEventEmitter,
  createMockStripeService,
} from '../../../test/helpers/test-factory';

describe('JobService', () => {
  let module: TestingModule;
  let service: JobService;
  let repository: ReturnType<typeof createMockRepository> & { createQueryBuilder: jest.Mock; findOneBy: jest.Mock };
  let refundRequestRepo: ReturnType<typeof createMockRepository> & { createQueryBuilder: jest.Mock };
  let paymentRepo: ReturnType<typeof createMockRepository>;
  let feeConfigRepo: ReturnType<typeof createMockRepository>;
  let refundRepo: ReturnType<typeof createMockRepository>;
  let contractRepo: ReturnType<typeof createMockRepository>;
  let subscriptionRepo: ReturnType<typeof createMockRepository>;
  let transactionRepo: ReturnType<typeof createMockRepository> & { createQueryBuilder: jest.Mock };
  let stripeService: ReturnType<typeof createMockStripeService>;

  beforeEach(async () => {
    repository = {
      ...createMockRepository(),
      createQueryBuilder: jest.fn(),
      findOneBy: jest.fn(),
    } as any;
    refundRequestRepo = {
      ...createMockRepository(),
      createQueryBuilder: jest.fn(),
    } as any;
    paymentRepo = createMockRepository();
    feeConfigRepo = createMockRepository();
    refundRepo = createMockRepository();
    contractRepo = createMockRepository();
    subscriptionRepo = createMockRepository();
    transactionRepo = {
      ...createMockRepository(),
      createQueryBuilder: jest.fn(),
    } as any;
    stripeService = createMockStripeService();
    const txHelper = createMockTransactionHelper();
    const eventEmitter = createMockEventEmitter();

    module = await Test.createTestingModule({
      providers: [
        JobService,
        { provide: getRepositoryToken(Job), useValue: repository },
        { provide: getRepositoryToken(JobPhoto), useValue: createMockRepository() },
        { provide: getRepositoryToken(Payment), useValue: paymentRepo },
        { provide: getRepositoryToken(Refund), useValue: refundRepo },
        { provide: getRepositoryToken(RefundRequest), useValue: refundRequestRepo },
        { provide: getRepositoryToken(RefundEvidencePhoto), useValue: createMockRepository() },
        { provide: getRepositoryToken(JobContract), useValue: contractRepo },
        { provide: getRepositoryToken(Subscription), useValue: subscriptionRepo },
        { provide: getRepositoryToken(Transaction), useValue: transactionRepo },
        { provide: getRepositoryToken(Category), useValue: createMockRepository() },
        { provide: getRepositoryToken(PlatformFeeConfig), useValue: feeConfigRepo },
        { provide: StripeService, useValue: stripeService },
        { provide: TransactionHelper, useValue: txHelper },
        { provide: DomainEventEmitter, useValue: eventEmitter },
        { provide: AppCacheService, useValue: { delByPrefix: jest.fn(), del: jest.fn() } },
      ],
    }).compile();

    service = module.get<JobService>(JobService);
  });

  afterEach(() => module.close());

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    function makeQb(jobs: any[] = [], total = 0) {
      return {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where:             jest.fn().mockReturnThis(),
        andWhere:          jest.fn().mockReturnThis(),
        orderBy:           jest.fn().mockReturnThis(),
        skip:              jest.fn().mockReturnThis(),
        take:              jest.fn().mockReturnThis(),
        getManyAndCount:   jest.fn().mockResolvedValue([jobs, total]),
      };
    }

    it('should return paginated results', async () => {
      const qb = makeQb();
      repository.createQueryBuilder.mockReturnValue(qb);

      const result = await service.findAll(new JobQueryDto());

      expect(result.items).toEqual([]);
      expect(result.total).toBe(0);
    });

    it('should expose the job currency on feed items', async () => {
      const qb = makeQb(
        [
          {
            id: 'job-1',
            jobRef: 'JOB-001',
            title: 'Fix the sink',
            description: null,
            totalBudget: 200,
            currency: 'AUD',
            locationText: 'Bondi',
            category: null,
            createdAt: new Date('2026-01-01'),
          },
        ],
        1,
      );
      repository.createQueryBuilder.mockReturnValue(qb);

      const result = await service.findAll(new JobQueryDto());

      expect(result.items[0]?.currency).toBe('AUD');
      expect(result.items[0]?.budgetPrice).toBe(200);
    });

    it('should fall back to AUD when a job carries no currency', async () => {
      // The column is NOT NULL with an AUD default, so this only guards a Job built in memory
      // — the point is that currency never serialises as undefined.
      const qb = makeQb(
        [{ id: 'job-2', title: 'No currency', createdAt: new Date(), category: null }],
        1,
      );
      repository.createQueryBuilder.mockReturnValue(qb);

      const result = await service.findAll(new JobQueryDto());

      expect(result.items[0]?.currency).toBe('AUD');
    });

    it('should always restrict feed to POSTED and BIDDING statuses', async () => {
      const qb = makeQb();
      repository.createQueryBuilder.mockReturnValue(qb);

      await service.findAll(new JobQueryDto());

      expect(qb.andWhere).toHaveBeenCalledWith(
        'job.status IN (:...feedStatuses)',
        { feedStatuses: [JobStatus.POSTED, JobStatus.BIDDING] },
      );
    });

    it('should not show SELECTED jobs in the feed', async () => {
      const qb = makeQb();
      repository.createQueryBuilder.mockReturnValue(qb);

      await service.findAll(new JobQueryDto());

      const statusCall = (qb.andWhere as jest.Mock).mock.calls.find(
        ([sql]: [string]) => sql.includes('feedStatuses'),
      );
      expect(statusCall[1].feedStatuses).not.toContain(JobStatus.SELECTED);
    });

    it('should not show IN_PROGRESS jobs in the feed', async () => {
      const qb = makeQb();
      repository.createQueryBuilder.mockReturnValue(qb);

      await service.findAll(new JobQueryDto());

      const statusCall = (qb.andWhere as jest.Mock).mock.calls.find(
        ([sql]: [string]) => sql.includes('feedStatuses'),
      );
      expect(statusCall[1].feedStatuses).not.toContain(JobStatus.IN_PROGRESS);
    });

    it('should not show COMPLETED jobs in the feed', async () => {
      const qb = makeQb();
      repository.createQueryBuilder.mockReturnValue(qb);

      await service.findAll(new JobQueryDto());

      const statusCall = (qb.andWhere as jest.Mock).mock.calls.find(
        ([sql]: [string]) => sql.includes('feedStatuses'),
      );
      expect(statusCall[1].feedStatuses).not.toContain(JobStatus.COMPLETED);
    });

    it('should filter by BIDDING job type', async () => {
      const qb = makeQb();
      repository.createQueryBuilder.mockReturnValue(qb);

      await service.findAll(new JobQueryDto());

      expect(qb.where).toHaveBeenCalledWith('job.type = :type', { type: JobType.BIDDING });
    });
  });

  describe('findOne', () => {
    it('should throw NotFoundException when not found', async () => {
      repository.findOneBy.mockResolvedValue(null);
      await expect(service.findOne('non-existent-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findRequestedServices', () => {
    it('should filter bidding tab by BIDDING status only', async () => {
      const qb: any = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      };
      repository.createQueryBuilder.mockReturnValue(qb);

      await service.findRequestedServices('seeker-1', {
        page: 1,
        limit: 10,
        status: SeekerRequestStatusFilter.BIDDING,
      } as any);

      expect(qb.andWhere).toHaveBeenCalledWith('job.status IN (:...statuses)', {
        statuses: [JobStatus.BIDDING],
      });
    });

    it('should exclude declined bids from bid stats', async () => {
      const job = { id: 'job-1' };
      const mainQb: any = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[job], 1]),
      };
      const statsQb: any = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        from: jest.fn().mockReturnThis(),
        // Shared mock is reused for the bid-stats query and the cancellation-pending lookup
        // (getPendingCancellationEffectiveByJobIds), which also calls .innerJoin().
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([{ jobId: 'job-1', bidCount: '2', topBidPrice: '15000' }]),
      };
      repository.createQueryBuilder.mockReturnValue(mainQb);
      (repository as any).manager = {
        createQueryBuilder: jest.fn().mockReturnValue(statsQb),
        find: jest.fn().mockResolvedValue([]),
      };

      await service.findRequestedServices('seeker-1', { page: 1, limit: 10 } as any);

      expect(statsQb.andWhere).toHaveBeenCalledWith('b.status != :declined', { declined: BidStatus.DECLINED });
    });
  });

  describe('countRequestedServices', () => {
    const makeQb = (rows: object[]) => ({
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      getRawMany: jest.fn().mockResolvedValue(rows),
    });

    it('should bucket raw job statuses into filter tab counts', async () => {
      repository.createQueryBuilder.mockReturnValue(makeQb([
        { status: JobStatus.POSTED, count: '2' },
        { status: JobStatus.BIDDING, count: '1' },
        { status: JobStatus.IN_PROGRESS, count: '3' },
        { status: JobStatus.COMPLETED, count: '5' },
        { status: JobStatus.CANCELLED, count: '1' },
        { status: JobStatus.REJECTED, count: '1' },
      ]));

      const result = await service.countRequestedServices('seeker-1');

      expect(result).toEqual({
        requested:   2, // POSTED(2) only — BIDDING is no longer counted as "requested"
        in_progress: 3, // IN_PROGRESS(3); SELECTED and PENDING absent → 0
        completed:   5,
        cancelled:   1, // CANCELLED(1) only — REJECTED is DIRECT-flow and excluded from bidding-only counts
      });
    });

    it('should return all zeros when the seeker has no jobs', async () => {
      repository.createQueryBuilder.mockReturnValue(makeQb([]));

      const result = await service.countRequestedServices('seeker-1');

      expect(result).toEqual({ requested: 0, in_progress: 0, completed: 0, cancelled: 0 });
    });
  });

  describe('countMyServices', () => {
    const makeQb = (rows: object[]) => ({
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      getRawMany: jest.fn().mockResolvedValue(rows),
    });

    it('should count only IN_PROGRESS jobs for in_progress', async () => {
      repository.createQueryBuilder.mockReturnValue(makeQb([
        { status: JobStatus.SELECTED,    count: '2' },
        { status: JobStatus.PENDING,     count: '1' },
        { status: JobStatus.IN_PROGRESS, count: '4' },
        { status: JobStatus.COMPLETED,   count: '6' },
      ]));

      const result = await service.countMyServices('provider-1');

      expect(result).toEqual({
        to_do:       2,
        in_progress: 4,
        completed:   6,
        cancelled:   0,
      });
    });

    it('should return zeros when provider has no assigned jobs', async () => {
      repository.createQueryBuilder.mockReturnValue(makeQb([]));

      const result = await service.countMyServices('provider-1');

      expect(result).toEqual({ to_do: 0, in_progress: 0, completed: 0, cancelled: 0 });
    });

    it('should count cancelled jobs and ignore rejected', async () => {
      repository.createQueryBuilder.mockReturnValue(makeQb([
        { status: JobStatus.COMPLETED,  count: '3' },
        { status: JobStatus.CANCELLED,  count: '5' },
        { status: JobStatus.REJECTED,   count: '2' },
      ]));

      const result = await service.countMyServices('provider-1');

      expect(result).toEqual({ to_do: 0, in_progress: 0, completed: 3, cancelled: 5 });
    });
  });

  describe('countRequestedServicePayments', () => {
    const makeQb = (rows: object[]) => ({
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      leftJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      getRawMany: jest.fn().mockResolvedValue(rows),
    });

    it('should bucket payment statuses into tab counts', async () => {
      repository.createQueryBuilder.mockReturnValue(makeQb([
        { paymentStatus: 'succeeded', count: '4' },
        { paymentStatus: 'refunded', count: '2' },
        { paymentStatus: 'pending',   count: '1' },
        { paymentStatus: null,        count: '3' }, // jobs with no payment row
      ]));

      const result = await service.countRequestedServicePayments('seeker-1');

      expect(result).toEqual({
        all:      10,
        paid:     4,
        due:      4, // pending(1) + no-payment(3)
        refunded: 2,
      });
    });

    it('should count failed as due, but canceled only in all (terminal, not due)', async () => {
      repository.createQueryBuilder.mockReturnValue(makeQb([
        { paymentStatus: 'failed',   count: '2' },
        { paymentStatus: 'canceled', count: '3' }, // paid-then-cancelled — counted in all, not due
      ]));

      const result = await service.countRequestedServicePayments('seeker-1');

      expect(result).toEqual({ all: 5, paid: 0, due: 2, refunded: 0 });
    });

    it('should return all zeros when the seeker has no jobs', async () => {
      repository.createQueryBuilder.mockReturnValue(makeQb([]));

      const result = await service.countRequestedServicePayments('seeker-1');

      expect(result).toEqual({ all: 0, paid: 0, due: 0, refunded: 0 });
    });

    it('should exclude never-paid cancelled jobs from the counts', async () => {
      const qb = makeQb([]);
      repository.createQueryBuilder.mockReturnValue(qb);

      await service.countRequestedServicePayments('seeker-1');

      expect(qb.andWhere).toHaveBeenCalledWith(
        expect.stringContaining('SELECT 1 FROM transactions t'),
        { canceledStatus: PaymentStatus.CANCELED, paymentTxnType: TransactionType.PAYMENT },
      );
    });
  });

  // ── findRequestedServicePayments ──────────────────────────────────────────

  describe('findRequestedServicePayments', () => {
    it('should exclude declined bids from bid stats', async () => {
      const job = { id: 'job-1' };
      const mainQb: any = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[job], 1]),
      };
      const statsQb: any = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        from: jest.fn().mockReturnThis(),
        // Shared mock is reused for the bid-stats query and the cancellation-pending lookup
        // (getPendingCancellationEffectiveByJobIds), which also calls .innerJoin().
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([{ jobId: 'job-1', bidCount: '1', topBidPrice: '20000' }]),
      };
      const paymentStatusQb: any = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        from: jest.fn().mockReturnThis(),
        leftJoin: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([]),
      };
      repository.createQueryBuilder.mockReturnValue(mainQb);
      (repository as any).manager = { createQueryBuilder: jest.fn().mockReturnValue(statsQb) };
      (paymentRepo as any).manager = { createQueryBuilder: jest.fn().mockReturnValue(paymentStatusQb) };

      await service.findRequestedServicePayments('seeker-1', { page: 1, limit: 10 } as any);

      expect(statsQb.andWhere).toHaveBeenCalledWith('b.status != :declined', { declined: BidStatus.DECLINED });
    });

    it('should exclude never-paid cancelled jobs (CANCELED payment with no PAYMENT txn)', async () => {
      const mainQb: any = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      };
      repository.createQueryBuilder.mockReturnValue(mainQb);
      (repository as any).manager = { createQueryBuilder: jest.fn() };
      (paymentRepo as any).manager = { createQueryBuilder: jest.fn() };

      await service.findRequestedServicePayments('seeker-1', { page: 1, limit: 10 } as any);

      expect(mainQb.andWhere).toHaveBeenCalledWith(
        expect.stringContaining('SELECT 1 FROM transactions t'),
        { canceledStatus: PaymentStatus.CANCELED, paymentTxnType: TransactionType.PAYMENT },
      );
    });
  });

  // ── findRefundRequestsForProvider ──────────────────────────────────────────

  describe('findRefundRequestsForProvider', () => {
    const makeQb = (rawRows: object[], total: number) => ({
      innerJoin: jest.fn().mockReturnThis(),
      leftJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getCount: jest.fn().mockResolvedValue(total),
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getRawMany: jest.fn().mockResolvedValue(rawRows),
    });

    it('should return paginated refund requests for the provider', async () => {
      const rawRows = [
        {
          id: 'rr-1',
          jobTitle: 'Lawn Mowing',
          seekerFirstName: 'Jane',
          seekerLastName: 'Smith',
          seekerEmail: 'jane@test.com',
          reason: RefundRequestReason.POOR_SERVICE_QUALITY,
          amount: '15000',
          status: RefundRequestStatus.PENDING,
          createdAt: new Date('2026-05-01'),
        },
      ];
      refundRequestRepo.createQueryBuilder.mockReturnValue(makeQb(rawRows, 1));

      const result = await service.findRefundRequestsForProvider('provider-1', {
        page: 1, limit: 10, order: 'DESC', sortBy: 'createdAt',
      } as any);

      expect(result.total).toBe(1);
      expect(result.items[0]!.id).toBe('rr-1');
      expect(result.items[0]!.clientName).toBe('Jane Smith');
      expect(result.items[0]!.amount).toBe(15000);
    });

    it('should apply status filter when provided', async () => {
      const qb = makeQb([], 0);
      refundRequestRepo.createQueryBuilder.mockReturnValue(qb);

      await service.findRefundRequestsForProvider('provider-1', {
        page: 1, limit: 10, order: 'DESC', sortBy: 'createdAt',
        status: RefundRequestStatus.PENDING,
      } as any);

      expect(qb.andWhere).toHaveBeenCalledWith('rr.status = :status', {
        status: RefundRequestStatus.PENDING,
      });
    });

    it('should fall back to email when profile name is missing', async () => {
      const rawRows = [{
        id: 'rr-2',
        jobTitle: 'Cleaning',
        seekerFirstName: null,
        seekerLastName: null,
        seekerEmail: 'anon@test.com',
        reason: RefundRequestReason.OTHER,
        amount: '5000',
        status: RefundRequestStatus.PENDING,
        createdAt: new Date(),
      }];
      refundRequestRepo.createQueryBuilder.mockReturnValue(makeQb(rawRows, 1));

      const result = await service.findRefundRequestsForProvider('provider-1', {
        page: 1, limit: 10, order: 'DESC', sortBy: 'createdAt',
      } as any);

      expect(result.items[0]!.clientName).toBe('anon@test.com');
    });
  });

  // ── findRefundRequestDetailForProvider ────────────────────────────────────

  describe('findRefundRequestDetailForProvider', () => {
    const makeRefundRequest = (overrides: object = {}) => ({
      id: 'rr-1',
      payment: { id: 'pay-1' },
      job: {
        title: 'Lawn Mowing',
        description: 'Weekly mowing',
        locationText: '12 Park St',
        category: { id: 'cat-1', name: 'Gardening' },
        provider: { id: 'provider-1' },
      },
      seeker: {
        email: 'jane@test.com',
        profile: { firstName: 'Jane', lastName: 'Smith', avatarUrl: null },
      },
      reason: RefundRequestReason.POOR_SERVICE_QUALITY,
      comments: 'Work was incomplete.',
      requestedAmount: 15000,
      status: RefundRequestStatus.PENDING,
      evidencePhotos: [
        { fileUrl: 'https://storage.test/photo1.jpg', side: RefundEvidenceSide.SEEKER, sortOrder: 0 },
        { fileUrl: 'https://storage.test/admin.jpg', side: RefundEvidenceSide.ADMIN, sortOrder: 0 },
      ],
      createdAt: new Date('2026-05-01'),
      ...overrides,
    });

    it('should throw NotFoundException when refund request does not exist', async () => {
      refundRequestRepo.findOne.mockResolvedValue(null);

      await expect(
        service.findRefundRequestDetailForProvider('non-existent', 'provider-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when provider does not own the job', async () => {
      refundRequestRepo.findOne.mockResolvedValue(
        makeRefundRequest({ job: { provider: { id: 'other-provider' } } }),
      );

      await expect(
        service.findRefundRequestDetailForProvider('rr-1', 'provider-1'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should return detail DTO with only seeker evidence photos', async () => {
      refundRequestRepo.findOne.mockResolvedValue(makeRefundRequest());

      const result = await service.findRefundRequestDetailForProvider('rr-1', 'provider-1');

      expect(result.id).toBe('rr-1');
      expect(result.paymentId).toBe('pay-1');
      expect(result.job.title).toBe('Lawn Mowing');
      expect(result.job.category).toBe('Gardening');
      expect(result.client.name).toBe('Jane Smith');
      expect(result.attachments).toEqual(['https://storage.test/photo1.jpg']); // admin photo filtered out
      expect(result.amount).toBe(15000);
    });

    it('should return null category when job has no category', async () => {
      refundRequestRepo.findOne.mockResolvedValue(
        makeRefundRequest({ job: { title: 'Lawn Mowing', description: null, locationText: null, category: null, provider: { id: 'provider-1' } } }),
      );

      const result = await service.findRefundRequestDetailForProvider('rr-1', 'provider-1');

      expect(result.job.category).toBeNull();
    });

    it('should find refund request when provider is set via provider relation', async () => {
      refundRequestRepo.findOne.mockResolvedValue(
        makeRefundRequest({
          job: {
            title: 'Lawn Mowing', description: null, locationText: null, category: null,
            provider: { id: 'provider-1' },
          },
        }),
      );

      const result = await service.findRefundRequestDetailForProvider('rr-1', 'provider-1');

      expect(result.id).toBe('rr-1');
    });
  });

  // ── rejectRefundRequest ────────────────────────────────────────────────────

  describe('rejectRefundRequest', () => {
    const makePendingRr = (overrides: object = {}) => ({
      id: 'rr-1',
      status: RefundRequestStatus.PENDING,
      job: {
        id: 'job-1',
        title: 'Test Job',
        provider: { id: 'provider-1' },
        seeker: { id: 'seeker-1' },
      },
      ...overrides,
    });

    it('should throw NotFoundException when refund request not found', async () => {
      refundRequestRepo.findOne.mockResolvedValue(null);

      await expect(
        service.rejectRefundRequest('non-existent', 'provider-1', { rejectionReason: 'Not valid' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when provider does not own the job', async () => {
      refundRequestRepo.findOne.mockResolvedValue(
        makePendingRr({ job: { provider: { id: 'other-provider' } } }),
      );

      await expect(
        service.rejectRefundRequest('rr-1', 'provider-1', { rejectionReason: 'Not valid' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException when refund request is not pending', async () => {
      refundRequestRepo.findOne.mockResolvedValue(
        makePendingRr({ status: RefundRequestStatus.APPROVED }),
      );

      await expect(
        service.rejectRefundRequest('rr-1', 'provider-1', { rejectionReason: 'Not valid' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should update status to REJECTED with rejectionReason and reviewedAt', async () => {
      refundRequestRepo.findOne.mockResolvedValue(makePendingRr());

      await service.rejectRefundRequest('rr-1', 'provider-1', { rejectionReason: 'Work was completed as agreed.' });

      const txRun = (service as any).txHelper.run;
      expect(txRun).toHaveBeenCalled();
    });

    it('should save attachment photos when attachmentUrls are provided', async () => {
      refundRequestRepo.findOne.mockResolvedValue(makePendingRr());

      await service.rejectRefundRequest('rr-1', 'provider-1', {
        rejectionReason: 'Work was completed.',
        attachmentUrls: ['https://storage.test/counter1.jpg', 'https://storage.test/counter2.jpg'],
      });

      const txRun = (service as any).txHelper.run;
      expect(txRun).toHaveBeenCalled();
    });

    it('should resolve provider via provider relation', async () => {
      refundRequestRepo.findOne.mockResolvedValue(
        makePendingRr({ job: { id: 'job-1', title: 'Test Job', provider: { id: 'provider-1' }, seeker: { id: 'seeker-1' } } }),
      );

      await expect(
        service.rejectRefundRequest('rr-1', 'provider-1', { rejectionReason: 'Dispute' }),
      ).resolves.toEqual({ id: 'rr-1' });
    });
  });

  // ── findOneDetail ──────────────────────────────────────────────────────────

  describe('findOneDetail', () => {
    const JOB_ID = 'job-1';
    const SEEKER_ID = 'seeker-1';
    const PROVIDER_ID = 'provider-1';
    const BID_ID = 'bid-1';

    function makeJob(overrides: object = {}): any {
      return {
        id: JOB_ID,
        jobRef: 'JOB-000001',
        title: 'Fix pipes',
        type: 'bidding',
        status: 'posted',
        seeker: { id: SEEKER_ID, email: 's@test.com', profile: { firstName: 'Jane', lastName: 'Doe', avatarUrl: null } },
        provider: null,
        selectedBid: null,
        category: null,
        photos: [],
        serviceDuration: 'single_task',
        createdAt: new Date('2026-01-01'),
        ...overrides,
      };
    }

    beforeEach(() => {
      // findOneDetail computes topBidPrice (getRawOne) and the pending-cancellation lookup
      // (getRawMany) via jobRepository.manager.createQueryBuilder().
      (repository as any).manager = {
        createQueryBuilder: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnThis(),
          addSelect: jest.fn().mockReturnThis(),
          from: jest.fn().mockReturnThis(),
          innerJoin: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          andWhere: jest.fn().mockReturnThis(),
          getRawOne: jest.fn().mockResolvedValue({ topBidPrice: null }),
          getRawMany: jest.fn().mockResolvedValue([]),
          findOne: jest.fn().mockResolvedValue(null),
        }),
        findOne: jest.fn().mockResolvedValue(null),
        count: jest.fn().mockResolvedValue(0),
      };
    });

    it('should throw NotFoundException when job does not exist', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.findOneDetail(JOB_ID, SEEKER_ID, ['SEEKER'])).rejects.toThrow(NotFoundException);
    });

    it('should return statusRail for seeker (job owner) and no myBid', async () => {
      repository.findOne.mockResolvedValue(makeJob());
      paymentRepo.findOne.mockResolvedValue(null);

      const result = await service.findOneDetail(JOB_ID, SEEKER_ID, ['SEEKER']);

      expect(result.statusRail).toBeDefined();
      expect((result as any).myBid).toBeUndefined();
    });

    it('should expose hasReviewed=false for a seeker who has not reviewed the job', async () => {
      repository.findOne.mockResolvedValue(makeJob());
      paymentRepo.findOne.mockResolvedValue(null);
      (repository as any).manager.count.mockResolvedValue(0);

      const result = await service.findOneDetail(JOB_ID, SEEKER_ID, ['SEEKER']);

      expect(result.hasReviewed).toBe(false);
    });

    it('should expose hasReviewed=true once the seeker has reviewed the job', async () => {
      repository.findOne.mockResolvedValue(makeJob());
      paymentRepo.findOne.mockResolvedValue(null);
      (repository as any).manager.count.mockResolvedValue(1);

      const result = await service.findOneDetail(JOB_ID, SEEKER_ID, ['SEEKER']);

      expect(result.hasReviewed).toBe(true);
    });

    it('should return myBid for browsing provider who has an existing bid', async () => {
      repository.findOne.mockResolvedValue(makeJob());
      (repository as any).manager.findOne = jest.fn().mockResolvedValue({ id: BID_ID, price: '150.00', status: 'submitted' });

      const result = await service.findOneDetail(JOB_ID, PROVIDER_ID, ['PROVIDER']);

      expect(result.myBid).toEqual({ id: BID_ID, price: 150, status: 'submitted' });
    });

    it('should return myBid as null for browsing provider who has not bid yet', async () => {
      repository.findOne.mockResolvedValue(makeJob());
      (repository as any).manager.findOne = jest.fn().mockResolvedValue(null);

      const result = await service.findOneDetail(JOB_ID, PROVIDER_ID, ['PROVIDER']);

      expect(result.myBid).toBeNull();
    });

    it('should not include myBid for seeker browsing another seeker job', async () => {
      repository.findOne.mockResolvedValue(makeJob());
      paymentRepo.findOne.mockResolvedValue(null);

      const result = await service.findOneDetail(JOB_ID, 'other-seeker', ['SEEKER']);

      expect((result as any).myBid).toBeUndefined();
    });

    it('should return myBid with accepted status for the selected provider', async () => {
      repository.findOne.mockResolvedValue(makeJob({
        status: 'selected',
        provider: { id: PROVIDER_ID, profile: { avatarUrl: null } },
        selectedBid: { id: BID_ID, price: '200.00' },
      }));
      paymentRepo.findOne.mockResolvedValue(null);

      const result = await service.findOneDetail(JOB_ID, PROVIDER_ID, ['PROVIDER']);

      expect(result.myBid).toEqual({ id: BID_ID, price: 200, status: 'accepted' });
      expect(result.selectedBidPrice).toBe(200);
    });
  });

  // ── getCancelPreview ───────────────────────────────────────────────────────

  describe('getCancelPreview', () => {
    const JOB_ID = 'job-cancel-1';
    const SEEKER_ID = 'seeker-cancel-1';

    const makeJob = (overrides: object = {}) => ({
      id: JOB_ID,
      type: JobType.BIDDING,
      status: JobStatus.SELECTED,
      serviceDuration: ServiceDuration.SINGLE_TASK,
      // Booked long ago → past the cooling-off window, so computeCancellationFee applies the fee.
      createdAt: new Date('2020-01-01'),
      seeker: { id: SEEKER_ID },
      ...overrides,
    });

    const makeFeeConfig = (overrides: object = {}) => ({
      cancellationFeePercent: 10,   // 10%
      currency: 'AUD',
      ...overrides,
    });

    // feeConfigRepository.find({ order, take: 1 }) → destructured as [feeConfig]
    const mockFeeConfigFind = (config: object | null) => {
      feeConfigRepo.find.mockResolvedValue(config ? [config] : []);
    };

    it('should return correct preview when payment exists', async () => {
      repository.findOne.mockResolvedValue(makeJob());
      paymentRepo.findOne.mockResolvedValue({ amount: 100, status: PaymentStatus.SUCCEEDED }); // $100
      mockFeeConfigFind(makeFeeConfig());

      const result = await service.getCancelPreview(JOB_ID, SEEKER_ID);

      expect(result.paidAmount).toBe(100);
      expect(result.cancellationFee).toBe(10);
      expect(result.refundedAmount).toBe(90);  // 100 - 10
      expect(result.currency).toBe('AUD');
    });

    it('should charge the fee as a percentage of the paid amount', async () => {
      repository.findOne.mockResolvedValue(makeJob());
      paymentRepo.findOne.mockResolvedValue({ amount: 5, status: PaymentStatus.SUCCEEDED }); // $5 paid
      mockFeeConfigFind(makeFeeConfig());

      const result = await service.getCancelPreview(JOB_ID, SEEKER_ID);

      expect(result.cancellationFee).toBe(0.5);   // 10% of $5
      expect(result.refundedAmount).toBe(4.5);    // 5 − 0.5
    });

    it('should return paidAmount=0 and no fee when no payment exists yet', async () => {
      repository.findOne.mockResolvedValue(makeJob());
      paymentRepo.findOne.mockResolvedValue(null);
      mockFeeConfigFind(makeFeeConfig());

      const result = await service.getCancelPreview(JOB_ID, SEEKER_ID);

      expect(result.paidAmount).toBe(0);
      expect(result.refundedAmount).toBe(0);
      expect(result.cancellationFee).toBe(0);   // 10% of $0
    });

    it('should use the default 10% fee when no fee config exists', async () => {
      repository.findOne.mockResolvedValue(makeJob());
      paymentRepo.findOne.mockResolvedValue({ amount: 100, status: PaymentStatus.SUCCEEDED });
      mockFeeConfigFind(null);

      const result = await service.getCancelPreview(JOB_ID, SEEKER_ID);

      expect(result.cancellationFee).toBe(10);   // 10% of $100
      expect(result.cancellationFeePercent).toBe(10);
      expect(result.currency).toBe('AUD');
    });

    it('should throw BadRequestException for recurring subscription jobs', async () => {
      repository.findOne.mockResolvedValue(makeJob({ serviceDuration: ServiceDuration.THREE_MONTHS }));
      mockFeeConfigFind(makeFeeConfig());

      await expect(service.getCancelPreview(JOB_ID, SEEKER_ID)).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when job does not exist', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.getCancelPreview(JOB_ID, SEEKER_ID)).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when seeker does not own the job', async () => {
      repository.findOne.mockResolvedValue(makeJob({ seeker: { id: 'other-seeker' } }));

      await expect(service.getCancelPreview(JOB_ID, SEEKER_ID)).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException when job is not a bidding job', async () => {
      repository.findOne.mockResolvedValue(makeJob({ type: JobType.DIRECT }));

      await expect(service.getCancelPreview(JOB_ID, SEEKER_ID)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when job status is not cancellable', async () => {
      repository.findOne.mockResolvedValue(makeJob({ status: JobStatus.COMPLETED }));

      await expect(service.getCancelPreview(JOB_ID, SEEKER_ID)).rejects.toThrow(BadRequestException);
    });
  });

  // ── cancelJobBySeeker ──────────────────────────────────────────────────────

  describe('cancelJobBySeeker', () => {
    const JOB_ID = 'job-cancel-2';
    const SEEKER_ID = 'seeker-cancel-2';
    const CHARGE_ID = 'ch_test123';

    const makeJob = (overrides: object = {}) => ({
      id: JOB_ID,
      type: JobType.BIDDING,
      status: JobStatus.SELECTED,
      serviceDuration: ServiceDuration.SINGLE_TASK,
      // Booked long ago → past the cooling-off window, so the admin fee applies.
      createdAt: new Date('2020-01-01'),
      seeker: { id: SEEKER_ID },
      provider: { id: 'provider-1' },
      ...overrides,
    });

    const makePayment = (overrides: object = {}) => ({
      id: 'payment-1',
      amount: 100,          // $100.00 AUD
      status: PaymentStatus.SUCCEEDED,
      ...overrides,
    });

    // Charges are looked up from the Transaction ledger, not payment.stripeChargeId.
    const makeChargeableTxn = (overrides: object = {}) => ({
      stripeChargeId: CHARGE_ID,
      stripeInvoiceId: null,
      ...overrides,
    });

    const makeFeeConfig = (overrides: object = {}) => ({
      cancellationFeePercent: 10,  // 10%
      currency: 'AUD',
      ...overrides,
    });

    const mockFeeConfigFind = (config: object | null) => {
      feeConfigRepo.find.mockResolvedValue(config ? [config] : []);
    };

    it('should cancel job, issue Stripe refund, and return correct amounts', async () => {
      repository.findOne.mockResolvedValue(makeJob());
      paymentRepo.findOne.mockResolvedValue(makePayment());
      transactionRepo.findOne.mockResolvedValue(makeChargeableTxn());
      mockFeeConfigFind(makeFeeConfig());
      stripeService.createRefund.mockResolvedValue({ id: 're_test', status: 'succeeded', amount: 9000 } as any);

      const result = await service.cancelJobBySeeker(JOB_ID, SEEKER_ID);

      // Full clawback: the entire $100 provider transfer is reversed first.
      expect(stripeService.reverseChargeTransfer).toHaveBeenCalledWith(
        CHARGE_ID,
        10000,
        `reverse:cancel:${CHARGE_ID}`,
      );
      // Then the seeker is refunded job − admin fee: (100 − 10) × 100 = 9000 cents, with
      // reverse_transfer=false (5th arg) since the transfer was already fully reversed.
      expect(stripeService.createRefund).toHaveBeenCalledWith(
        CHARGE_ID,
        9000,
        'seeker_cancellation',
        `refund:cancel:${CHARGE_ID}`,
        false,
      );
      expect(result.cancellationFee).toBe(10);
      expect(result.refundedAmount).toBe(90);   // $90.00 = 9000 cents / 100
      expect(result.currency).toBe('AUD');
    });

    it('should deduct the percentage fee on a small paid amount', async () => {
      repository.findOne.mockResolvedValue(makeJob());
      paymentRepo.findOne.mockResolvedValue(makePayment({ amount: 5 })); // $5 paid
      transactionRepo.findOne.mockResolvedValue(makeChargeableTxn());
      mockFeeConfigFind(makeFeeConfig());
      stripeService.createRefund.mockResolvedValue({ id: 're_small', status: 'succeeded', amount: 450 } as any);

      const result = await service.cancelJobBySeeker(JOB_ID, SEEKER_ID);

      // 10% of $5 = $0.50 fee → refund $4.50 (450 cents)
      expect(stripeService.createRefund).toHaveBeenCalledWith(
        'ch_test123', 450, 'seeker_cancellation', 'refund:cancel:ch_test123', false,
      );
      expect(result.refundedAmount).toBe(4.5);
    });

    it('should cancel job without Stripe call when no payment exists', async () => {
      repository.findOne.mockResolvedValue(makeJob());
      paymentRepo.findOne.mockResolvedValue(null);
      mockFeeConfigFind(makeFeeConfig());

      const result = await service.cancelJobBySeeker(JOB_ID, SEEKER_ID);

      expect(stripeService.createRefund).not.toHaveBeenCalled();
      expect(result.refundedAmount).toBe(0);
    });

    it('should flip the lingering PENDING payment (never checked out) to CANCELED', async () => {
      repository.findOne.mockResolvedValue(makeJob());
      paymentRepo.findOne.mockResolvedValue(null); // no SUCCEEDED payment to refund
      mockFeeConfigFind(makeFeeConfig());

      const save = jest.fn().mockImplementation((_e: unknown, data: unknown) => data);
      (service as any).txHelper.run.mockImplementationOnce(async (cb: any) =>
        cb({
          manager: {
            createQueryBuilder: jest.fn().mockReturnValue({
              update: jest.fn().mockReturnThis(),
              set: jest.fn().mockReturnThis(),
              where: jest.fn().mockReturnThis(),
              andWhere: jest.fn().mockReturnThis(),
              execute: jest.fn().mockResolvedValue({ affected: 1 }),
            }),
            findOne: jest.fn().mockResolvedValue({ id: 'pending-pay-1', status: PaymentStatus.PENDING }),
            save,
            update: jest.fn().mockResolvedValue({ affected: 1 }),
          },
        }),
      );

      await service.cancelJobBySeeker(JOB_ID, SEEKER_ID);

      expect(save).toHaveBeenCalledWith(
        Payment,
        expect.objectContaining({ id: 'pending-pay-1', status: PaymentStatus.CANCELED }),
      );
    });

    it('should throw BadRequestException for recurring subscription jobs', async () => {
      repository.findOne.mockResolvedValue(makeJob({ serviceDuration: ServiceDuration.THREE_MONTHS }));
      mockFeeConfigFind(makeFeeConfig());

      await expect(service.cancelJobBySeeker(JOB_ID, SEEKER_ID)).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when job does not exist', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.cancelJobBySeeker(JOB_ID, SEEKER_ID)).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when seeker does not own the job', async () => {
      repository.findOne.mockResolvedValue(makeJob({ seeker: { id: 'other-seeker' } }));

      await expect(service.cancelJobBySeeker(JOB_ID, SEEKER_ID)).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException when job status is not cancellable', async () => {
      repository.findOne.mockResolvedValue(makeJob({ status: JobStatus.COMPLETED }));

      await expect(service.cancelJobBySeeker(JOB_ID, SEEKER_ID)).rejects.toThrow(BadRequestException);
    });
  });

  // ── createContract ────────────────────────────────────────────────────────

  describe('createContract', () => {
    const JOB_ID = 'job-contract-1';
    const SEEKER_ID = 'seeker-1';
    const PROVIDER_ID = 'provider-1';

    const makeJob = (overrides: object = {}) => ({
      id: JOB_ID,
      status: JobStatus.SELECTED,
      serviceDuration: ServiceDuration.ONE_MONTH,
      engagement: 'direct',
      durationMonths: 3,
      seeker: { id: SEEKER_ID },
      provider: { id: PROVIDER_ID },
      ...overrides,
    });

    const makeDto = () => ({
      depositAmount: null,
      paymentFrequency: ContractPaymentFrequency.MONTHLY,
      earlyTermination: true,
      confidentialityClause: true,
      additionalClause: null,
    });

    const makeSavedContract = () => ({
      id: 'contract-1',
      job: makeJob(),
      depositAmount: null,
      paymentFrequency: ContractPaymentFrequency.MONTHLY,
      earlyTermination: true,
      confidentialityClause: true,
      additionalClause: null,
      createdAt: new Date('2026-01-01'),
    });

    it('should throw NotFoundException when job not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.createContract(JOB_ID, SEEKER_ID, makeDto() as any)).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when caller is not the seeker', async () => {
      repository.findOne.mockResolvedValue(makeJob({ seeker: { id: 'other-user' } }));

      await expect(service.createContract(JOB_ID, SEEKER_ID, makeDto() as any)).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException when job is not in SELECTED status', async () => {
      repository.findOne.mockResolvedValue(makeJob({ status: JobStatus.BIDDING }));

      await expect(service.createContract(JOB_ID, SEEKER_ID, makeDto() as any)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for SINGLE_TASK job', async () => {
      repository.findOne.mockResolvedValue(makeJob({ serviceDuration: ServiceDuration.SINGLE_TASK }));

      await expect(service.createContract(JOB_ID, SEEKER_ID, makeDto() as any)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when contract already exists', async () => {
      repository.findOne.mockResolvedValue(makeJob());
      contractRepo.findOne.mockResolvedValue({ id: 'existing-contract' });

      await expect(service.createContract(JOB_ID, SEEKER_ID, makeDto() as any)).rejects.toThrow(BadRequestException);
    });

    it('should create contract and subscription using provider id', async () => {
      repository.findOne.mockResolvedValue(makeJob());
      contractRepo.findOne.mockResolvedValue(null);
      const saved = makeSavedContract();
      contractRepo.create.mockReturnValue(saved);
      contractRepo.save.mockResolvedValue(saved);
      subscriptionRepo.create.mockReturnValue({ id: 'sub-1' });
      subscriptionRepo.save.mockResolvedValue({ id: 'sub-1' });

      await service.createContract(JOB_ID, SEEKER_ID, makeDto() as any);

      expect(subscriptionRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          provider: { id: PROVIDER_ID },
          seeker: { id: SEEKER_ID },
        }),
      );
      expect(subscriptionRepo.save).toHaveBeenCalled();
    });

    it('should pass depositAmount when provided', async () => {
      repository.findOne.mockResolvedValue(makeJob());
      contractRepo.findOne.mockResolvedValue(null);
      const dto = { ...makeDto(), depositAmount: 500 };
      const saved = { ...makeSavedContract(), depositAmount: 500 };
      contractRepo.create.mockReturnValue(saved);
      contractRepo.save.mockResolvedValue(saved);
      subscriptionRepo.create.mockReturnValue({ id: 'sub-1' });
      subscriptionRepo.save.mockResolvedValue({ id: 'sub-1' });

      await service.createContract(JOB_ID, SEEKER_ID, dto as any);

      expect(contractRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ depositAmount: 500 }),
      );
    });
  });

  // ── findMyServices ────────────────────────────────────────────────────────

  describe('findMyServices', () => {
    const makeQb = (rows: object[] = []) => ({
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue([rows, rows.length]),
    });

    beforeEach(() => {
      // findMyServices batches a pending-cancellation lookup (getPendingCancellationEffectiveByJobIds)
      // via jobRepository.manager.createQueryBuilder() for every page of results.
      (repository as any).manager = {
        createQueryBuilder: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnThis(),
          addSelect: jest.fn().mockReturnThis(),
          from: jest.fn().mockReturnThis(),
          innerJoin: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          andWhere: jest.fn().mockReturnThis(),
          getRawMany: jest.fn().mockResolvedValue([]),
        }),
      };
    });

    const makeQuery = (status: MyServiceStatusFilter, overrides: object = {}) => ({
      status,
      page: 1,
      limit: 10,
      sortBy: 'createdAt',
      order: 'DESC' as const,
      ...overrides,
    });

    it('should map to_do to SELECTED status', async () => {
      const qb = makeQb();
      repository.createQueryBuilder.mockReturnValue(qb);

      await service.findMyServices('provider-1', makeQuery(MyServiceStatusFilter.TO_DO) as any);

      expect(qb.andWhere).toHaveBeenCalledWith('job.status = :status', { status: JobStatus.SELECTED });
    });

    // ── Filters ──────────────────────────────────────────────────────────────

    it('should filter by categoryId', async () => {
      const qb = makeQb();
      repository.createQueryBuilder.mockReturnValue(qb);

      await service.findMyServices(
        'provider-1',
        makeQuery(MyServiceStatusFilter.TO_DO, { categoryId: 'cat-1' }) as any,
      );

      expect(qb.andWhere).toHaveBeenCalledWith('category.id = :categoryId', { categoryId: 'cat-1' });
    });

    it('should filter by locationText with a partial match', async () => {
      const qb = makeQb();
      repository.createQueryBuilder.mockReturnValue(qb);

      await service.findMyServices(
        'provider-1',
        makeQuery(MyServiceStatusFilter.TO_DO, { locationText: 'Bondi' }) as any,
      );

      expect(qb.andWhere).toHaveBeenCalledWith('job.locationText ILIKE :locationText', {
        locationText: '%Bondi%',
      });
    });

    it('should bound minPrice/maxPrice against totalBudget, not budgetPrice', async () => {
      // budgetPrice is the per-period rate on an ongoing job; totalBudget is the contract value.
      const qb = makeQb();
      repository.createQueryBuilder.mockReturnValue(qb);

      await service.findMyServices(
        'provider-1',
        makeQuery(MyServiceStatusFilter.TO_DO, { minPrice: 0, maxPrice: 533 }) as any,
      );

      expect(qb.andWhere).toHaveBeenCalledWith('job.totalBudget >= :minPrice', { minPrice: 0 });
      expect(qb.andWhere).toHaveBeenCalledWith('job.totalBudget <= :maxPrice', { maxPrice: 533 });

      const clauses: string[] = qb.andWhere.mock.calls.map((c: any[]) => String(c[0]));
      expect(clauses.some((c) => c.includes('budgetPrice'))).toBe(false);
    });

    it('should apply minPrice of 0 rather than treating it as absent', async () => {
      // 0 is falsy — a truthiness check here would silently drop the lower bound.
      const qb = makeQb();
      repository.createQueryBuilder.mockReturnValue(qb);

      await service.findMyServices(
        'provider-1',
        makeQuery(MyServiceStatusFilter.TO_DO, { minPrice: 0 }) as any,
      );

      expect(qb.andWhere).toHaveBeenCalledWith('job.totalBudget >= :minPrice', { minPrice: 0 });
    });

    it('should apply each price bound independently', async () => {
      const qb = makeQb();
      repository.createQueryBuilder.mockReturnValue(qb);

      await service.findMyServices(
        'provider-1',
        makeQuery(MyServiceStatusFilter.TO_DO, { maxPrice: 100 }) as any,
      );

      const clauses: string[] = qb.andWhere.mock.calls.map((c: any[]) => String(c[0]));
      expect(clauses).toContain('job.totalBudget <= :maxPrice');
      expect(clauses).not.toContain('job.totalBudget >= :minPrice');
    });

    it('should apply no price/category/location filters when none are supplied', async () => {
      const qb = makeQb();
      repository.createQueryBuilder.mockReturnValue(qb);

      await service.findMyServices('provider-1', makeQuery(MyServiceStatusFilter.TO_DO) as any);

      const clauses: string[] = qb.andWhere.mock.calls.map((c: any[]) => String(c[0]));
      expect(clauses.some((c) => c.includes('totalBudget'))).toBe(false);
      expect(clauses.some((c) => c.includes('categoryId'))).toBe(false);
      expect(clauses.some((c) => c.includes('locationText'))).toBe(false);
    });

    it('should map in_progress to IN_PROGRESS status', async () => {
      const qb = makeQb();
      repository.createQueryBuilder.mockReturnValue(qb);

      await service.findMyServices('provider-1', makeQuery(MyServiceStatusFilter.IN_PROGRESS) as any);

      expect(qb.andWhere).toHaveBeenCalledWith('job.status = :status', { status: JobStatus.IN_PROGRESS });
    });

    it('should map completed to COMPLETED status', async () => {
      const qb = makeQb();
      repository.createQueryBuilder.mockReturnValue(qb);

      await service.findMyServices('provider-1', makeQuery(MyServiceStatusFilter.COMPLETED) as any);

      expect(qb.andWhere).toHaveBeenCalledWith('job.status = :status', { status: JobStatus.COMPLETED });
    });

    it('should filter by providerId', async () => {
      const qb = makeQb();
      repository.createQueryBuilder.mockReturnValue(qb);

      await service.findMyServices('provider-99', makeQuery(MyServiceStatusFilter.IN_PROGRESS) as any);

      expect(qb.where).toHaveBeenCalledWith('job.provider_user_id = :providerId', { providerId: 'provider-99' });
    });

    it('should apply year filter when provided', async () => {
      const qb = makeQb();
      repository.createQueryBuilder.mockReturnValue(qb);

      await service.findMyServices('provider-1', makeQuery(MyServiceStatusFilter.COMPLETED, { year: 2025 }) as any);

      expect(qb.andWhere).toHaveBeenCalledWith('EXTRACT(YEAR FROM job.selected_at) = :year', { year: 2025 });
    });

    it('should apply month filter when provided', async () => {
      const qb = makeQb();
      repository.createQueryBuilder.mockReturnValue(qb);

      await service.findMyServices('provider-1', makeQuery(MyServiceStatusFilter.COMPLETED, { month: 3 }) as any);

      expect(qb.andWhere).toHaveBeenCalledWith('EXTRACT(MONTH FROM job.selected_at) = :month', { month: 3 });
    });

    it('should not apply year/month filters when not provided', async () => {
      const qb = makeQb();
      repository.createQueryBuilder.mockReturnValue(qb);

      await service.findMyServices('provider-1', makeQuery(MyServiceStatusFilter.IN_PROGRESS) as any);

      const andWhereCalls = qb.andWhere.mock.calls.map((c: any[]) => c[0]);
      expect(andWhereCalls).not.toContain(expect.stringContaining('YEAR'));
      expect(andWhereCalls).not.toContain(expect.stringContaining('MONTH'));
    });

    it('should return paginated response with categoryNames', async () => {
      const jobs = [
        { id: 'j1', title: 'Lawn Mowing', status: JobStatus.IN_PROGRESS, selectedBid: { price: '80' }, selectedAt: new Date(), category: { id: 'cat-1', name: 'Gardening' } },
      ];
      repository.createQueryBuilder.mockReturnValue(makeQb(jobs));

      const result = await service.findMyServices('provider-1', makeQuery(MyServiceStatusFilter.IN_PROGRESS) as any);

      expect(result.total).toBe(1);
      expect(result.items[0]!.id).toBe('j1');
      expect(result.items[0]!.price).toBe(80);
      expect(result.items[0]!.status).toBe(MyServiceStatusFilter.IN_PROGRESS);
      expect(result.items[0]!.categoryName).toBe('Gardening');
    });

    it('should return null categoryName when job has no category', async () => {
      const jobs = [
        { id: 'j2', title: 'Cleaning', status: JobStatus.IN_PROGRESS, selectedBid: { price: '50' }, selectedAt: new Date(), category: null },
      ];
      repository.createQueryBuilder.mockReturnValue(makeQb(jobs));

      const result = await service.findMyServices('provider-1', makeQuery(MyServiceStatusFilter.IN_PROGRESS) as any);

      expect(result.items[0]!.categoryName).toBeNull();
    });
  });

  // ── updateStatus ──────────────────────────────────────────────────────────

  describe('update — budget terms', () => {
    const JOB_ID = 'job-update-1';
    const SEEKER_ID = 'seeker-update-1';

    const makeJob = (overrides: object = {}) => ({
      id: JOB_ID,
      type: JobType.BIDDING,
      status: JobStatus.POSTED,
      serviceDuration: ServiceDuration.SINGLE_TASK,
      seeker: { id: SEEKER_ID },
      budgetPrice: 100,
      budgetPeriod: null,
      totalBudget: 100,
      ...overrides,
    });

    beforeEach(() => {
      (repository as any).manager = { count: jest.fn().mockResolvedValue(0) };
      repository.save.mockImplementation(async (r: any) => r);
    });

    it('allows a budget change while no provider has bid, and recomputes totalBudget', async () => {
      repository.findOne.mockResolvedValue(makeJob());

      await service.update(JOB_ID, { budgetPrice: 200 } as any, SEEKER_ID);

      const saved = repository.save.mock.calls[0]![0] as any;
      expect(saved.budgetPrice).toBe(200);
      // single_task → the total is just the price
      expect(saved.totalBudget).toBe(200);
    });

    it('recomputes totalBudget across the duration for an ongoing job', async () => {
      repository.findOne.mockResolvedValue(
        makeJob({
          serviceDuration: ServiceDuration.THREE_MONTHS,
          endDate: '2026-04-01',
          frequency: ServiceFrequency.DAILY,
          budgetPeriod: BillingPeriod.WEEKLY,
        }),
      );

      await service.update(JOB_ID, { budgetPrice: 50 } as any, SEEKER_ID);

      const saved = repository.save.mock.calls[0]![0] as any;
      // $50/week x 4 weeks/month x 3 months
      expect(saved.totalBudget).toBe(600);
    });

    it('rejects a budget change once a provider has bid', async () => {
      repository.findOne.mockResolvedValue(makeJob({ status: JobStatus.BIDDING }));
      (repository as any).manager.count.mockResolvedValue(1);

      await expect(
        service.update(JOB_ID, { budgetPrice: 200 } as any, SEEKER_ID),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(repository.save).not.toHaveBeenCalled();
    });

    it('does not check for bids when the update leaves the budget alone', async () => {
      repository.findOne.mockResolvedValue(makeJob({ status: JobStatus.BIDDING }));

      await service.update(JOB_ID, { title: 'Updated title' } as any, SEEKER_ID);

      expect((repository as any).manager.count).not.toHaveBeenCalled();
      expect(repository.save).toHaveBeenCalled();
    });
  });

  describe('updateStatus', () => {
    const JOB_ID = 'job-status-1';
    const PROVIDER_ID = 'provider-1';
    const SEEKER_ID = 'seeker-1';

    const makeJob = (status: JobStatus, overrides: object = {}) => ({
      id: JOB_ID,
      title: 'Test Job',
      status,
      type: JobType.BIDDING,
      seeker: { id: SEEKER_ID },
      provider: { id: PROVIDER_ID },
      ...overrides,
    });

    it('should throw NotFoundException when job not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(
        service.updateStatus(JOB_ID, PROVIDER_ID, { status: ProviderJobStatusTransition.IN_PROGRESS }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when caller is not the assigned provider', async () => {
      repository.findOne.mockResolvedValue(makeJob(JobStatus.SELECTED));

      await expect(
        service.updateStatus(JOB_ID, 'other-provider', { status: ProviderJobStatusTransition.IN_PROGRESS }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow SELECTED → IN_PROGRESS transition', async () => {
      const job = makeJob(JobStatus.SELECTED);
      repository.findOne.mockResolvedValue(job);
      repository.save.mockResolvedValue({ ...job, status: JobStatus.IN_PROGRESS });

      const result = await service.updateStatus(JOB_ID, PROVIDER_ID, { status: ProviderJobStatusTransition.IN_PROGRESS });

      expect(repository.save).toHaveBeenCalled();
      expect(result.status).toBe(JobStatus.IN_PROGRESS);
    });

    it('should allow IN_PROGRESS → COMPLETED transition', async () => {
      const job = makeJob(JobStatus.IN_PROGRESS);
      repository.findOne.mockResolvedValue(job);
      repository.save.mockResolvedValue({ ...job, status: JobStatus.COMPLETED });

      const result = await service.updateStatus(JOB_ID, PROVIDER_ID, { status: ProviderJobStatusTransition.COMPLETED });

      expect(repository.save).toHaveBeenCalled();
      expect(result.status).toBe(JobStatus.COMPLETED);
    });

    it('should throw BadRequestException for SELECTED → COMPLETED (skipping IN_PROGRESS)', async () => {
      repository.findOne.mockResolvedValue(makeJob(JobStatus.SELECTED));

      await expect(
        service.updateStatus(JOB_ID, PROVIDER_ID, { status: ProviderJobStatusTransition.COMPLETED }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for IN_PROGRESS → IN_PROGRESS (no-op)', async () => {
      repository.findOne.mockResolvedValue(makeJob(JobStatus.IN_PROGRESS));

      await expect(
        service.updateStatus(JOB_ID, PROVIDER_ID, { status: ProviderJobStatusTransition.IN_PROGRESS }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when job is already COMPLETED', async () => {
      repository.findOne.mockResolvedValue(makeJob(JobStatus.COMPLETED));

      await expect(
        service.updateStatus(JOB_ID, PROVIDER_ID, { status: ProviderJobStatusTransition.COMPLETED }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should emit JobStatusChangedEvent after successful transition', async () => {
      const eventEmitter = module.get(DomainEventEmitter);
      const job = makeJob(JobStatus.SELECTED);
      repository.findOne.mockResolvedValue(job);
      repository.save.mockResolvedValue({ ...job, status: JobStatus.IN_PROGRESS });

      await service.updateStatus(JOB_ID, PROVIDER_ID, { status: ProviderJobStatusTransition.IN_PROGRESS });

      expect(eventEmitter.emit).toHaveBeenCalledWith(
        expect.objectContaining({ providerId: PROVIDER_ID, seekerId: SEEKER_ID }),
      );
    });
  });
});
