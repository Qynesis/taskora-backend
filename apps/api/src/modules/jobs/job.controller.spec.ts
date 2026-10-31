import { Test, TestingModule } from '@nestjs/testing';
import { JobController } from './job.controller';
import { JobService } from './job.service';
import { BidService } from '../bids/bid.service';
import { JobDetailResponseDto } from './dto/job-detail-response.dto';
import { ServiceDuration, JobStatus } from '../../database/common/enum';

describe('JobController', () => {
  let controller: JobController;
  let jobService: {
    findAll: jest.Mock;
    create: jest.Mock;
    createRefundRequest: jest.Mock;
    createContract: jest.Mock;
    updateStatus: jest.Mock;
    countMyServices: jest.Mock;
    findRefundRequestsForProvider: jest.Mock;
    findRefundRequestDetailForProvider: jest.Mock;
    rejectRefundRequest: jest.Mock;
  };
  let bidService: { create: jest.Mock };

  beforeEach(async () => {
    jobService = {
      findAll: jest.fn(),
      create: jest.fn(),
      createRefundRequest: jest.fn(),
      createContract: jest.fn(),
      updateStatus: jest.fn(),
      countMyServices: jest.fn(),
      findRefundRequestsForProvider: jest.fn(),
      findRefundRequestDetailForProvider: jest.fn(),
      rejectRefundRequest: jest.fn(),
    };
    bidService = { create: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [JobController],
      providers: [
        { provide: JobService, useValue: jobService },
        { provide: BidService, useValue: bidService },
      ],
    })
      .useMocker((_token) =>
        new Proxy(
          {},
          {
            get: (_target, prop) => (prop === 'then' ? undefined : jest.fn()),
          },
        ),
      )
      .compile();

    controller = module.get<JobController>(JobController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should delegate getFeed to jobService', async () => {
    jobService.findAll.mockResolvedValue({ items: [], total: 0, page: 1, limit: 10 });

    const result = await controller.getFeed({ page: 1, limit: 10 } as any);

    expect(jobService.findAll).toHaveBeenCalledWith(expect.any(Object));
    expect(result.total).toBe(0);
  });

  it('should delegate createBid to bidService with current user id', async () => {
    bidService.create.mockResolvedValue({ id: 'bid-1', job: { seeker: { id: 'seeker-1' } } });

    const result = await controller.createBid('job-1', { amount: 200 } as any, { id: 'provider-1' } as any, {} as any);

    expect(bidService.create).toHaveBeenCalledWith('job-1', 'provider-1', { amount: 200 });
    expect(result.id).toBe('bid-1');
  });

  it('should delegate explore to jobService (public guest endpoint)', async () => {
    jobService.findAll.mockResolvedValue({ items: [{ id: 'j1', title: 'House Cleaning' }], total: 1, page: 1, limit: 10 });

    const result = await controller.explore({ page: 1, limit: 10 } as any);

    expect(jobService.findAll).toHaveBeenCalledWith(expect.any(Object));
    expect(result.items![0]!.id).toBe('j1');
    expect(result.total).toBe(1);
  });

  describe('JobDetailResponseDto.from() shortTerm field', () => {
    const baseJob = {
      id: 'job-1',
      jobRef: 'JOB-000001',
      title: 'Test Job',
      status: JobStatus.POSTED,
      seeker: { email: 'seeker@test.com' },
      photos: [],
      createdAt: new Date('2026-01-01'),
    } as any;

    it('should set shortTerm=true for single_task jobs', () => {
      const dto = JobDetailResponseDto.from({ ...baseJob, serviceDuration: ServiceDuration.SINGLE_TASK });
      expect(dto.shortTerm).toBe(true);
    });

    it('should set shortTerm=false for 1_month jobs', () => {
      const dto = JobDetailResponseDto.from({ ...baseJob, serviceDuration: ServiceDuration.ONE_MONTH });
      expect(dto.shortTerm).toBe(false);
    });

    it('should set shortTerm=false for 3_months jobs', () => {
      const dto = JobDetailResponseDto.from({ ...baseJob, serviceDuration: ServiceDuration.THREE_MONTHS });
      expect(dto.shortTerm).toBe(false);
    });

    it('should set shortTerm=false for 6_months jobs', () => {
      const dto = JobDetailResponseDto.from({ ...baseJob, serviceDuration: ServiceDuration.SIX_MONTHS });
      expect(dto.shortTerm).toBe(false);
    });
  });

  it('should delegate create and return id, title, locationText, serviceDuration', async () => {
    jobService.create.mockResolvedValue({
      id: 'job-1',
      title: 'House Cleaning',
      locationText: 'Sydney NSW 2000',
      serviceDuration: ServiceDuration.SINGLE_TASK,
    });

    const result = await controller.create({ title: 'House Cleaning' } as any, { id: 'seeker-1' } as any);

    expect(jobService.create).toHaveBeenCalledWith({ title: 'House Cleaning' }, 'seeker-1');
    expect(result).toEqual({
      id: 'job-1',
      title: 'House Cleaning',
      locationText: 'Sydney NSW 2000',
      serviceDuration: ServiceDuration.SINGLE_TASK,
    });
  });

  it('should delegate updateStatus and return { id }', async () => {
    jobService.updateStatus.mockResolvedValue({ id: 'job-1', status: 'completed', seeker: { id: 'seeker-1' } });

    const result = await controller.updateStatus('job-1', { status: 'completed' } as any, { id: 'provider-1' } as any, {} as any);

    expect(jobService.updateStatus).toHaveBeenCalledWith('job-1', 'provider-1', { status: 'completed' });
    expect(result).toEqual({ id: 'job-1' });
  });

  it('should delegate getMyServiceCounts with current user id', async () => {
    jobService.countMyServices.mockResolvedValue({ in_progress: 3, completed: 7 });

    const result = await controller.getMyServiceCounts({ id: 'provider-1' } as any);

    expect(jobService.countMyServices).toHaveBeenCalledWith('provider-1');
    expect(result).toEqual({ in_progress: 3, completed: 7 });
  });

  it('should delegate getRefundRequests to findRefundRequestsForProvider with provider id', async () => {
    const paginated = { items: [{ id: 'rr-1' }], total: 1, page: 1, limit: 10, totalPages: 1 };
    jobService.findRefundRequestsForProvider.mockResolvedValue(paginated);

    const result = await controller.getRefundRequests(
      { id: 'provider-1' } as any,
      { page: 1, limit: 10 } as any,
    );

    expect(jobService.findRefundRequestsForProvider).toHaveBeenCalledWith('provider-1', expect.any(Object));
    expect(result.total).toBe(1);
    expect(result.items[0]!.id).toBe('rr-1');
  });

  it('should delegate getRefundRequestDetail to findRefundRequestDetailForProvider with provider id', async () => {
    const detail = {
      id: 'rr-1',
      paymentId: 'pay-1',
      job: { title: 'Lawn Mowing', description: null, locationText: '12 Park St', category: null },
      client: { name: 'Jane Smith', email: 'jane@test.com', avatarUrl: null },
      reason: 'poor_service_quality',
      comments: 'Work was not finished.',
      amount: 15000,
      status: 'pending',
      photos: [],
      createdAt: new Date(),
    };
    jobService.findRefundRequestDetailForProvider.mockResolvedValue(detail);

    const result = await controller.getRefundRequestDetail('rr-1', { id: 'provider-1' } as any);

    expect(jobService.findRefundRequestDetailForProvider).toHaveBeenCalledWith('rr-1', 'provider-1');
    expect(result.id).toBe('rr-1');
    expect(result.paymentId).toBe('pay-1');
    expect(result.client.name).toBe('Jane Smith');
  });

  it('should delegate rejectRefundRequest to jobService with provider id', async () => {
    jobService.rejectRefundRequest.mockResolvedValue({ id: 'rr-1' });

    const result = await controller.rejectRefundRequest(
      'rr-1',
      { rejectionReason: 'Work was fine.', attachmentUrls: ['https://storage.test/img.jpg'] } as any,
      { id: 'provider-1' } as any,
    );

    expect(jobService.rejectRefundRequest).toHaveBeenCalledWith(
      'rr-1',
      'provider-1',
      expect.objectContaining({ rejectionReason: 'Work was fine.' }),
    );
    expect(result.id).toBe('rr-1');
  });

  it('should delegate createContract to jobService and return { id }', async () => {
    jobService.createContract.mockResolvedValue({ id: 'contract-1' });

    const result = await controller.createContract(
      'job-1',
      { startDate: '2026-06-01', endDate: '2026-09-01' } as any,
      { id: 'seeker-1' } as any,
    );

    expect(jobService.createContract).toHaveBeenCalledWith('job-1', 'seeker-1', expect.any(Object));
    expect(result).toEqual({ id: 'contract-1' });
  });

  it('should delegate refund request creation to jobService with seeker id', async () => {
    jobService.createRefundRequest.mockResolvedValue({ id: 'rr-1', status: 'pending' });

    const result = await controller.createRefundRequest(
      {
        jobId: 'job-1',
        reason: 'poor_service_quality',
        comments: 'Work was incomplete.',
        evidenceUrls: ['https://storage.test/evidence-1.jpg'],
      } as any,
      { id: 'seeker-1' } as any,
    );

    expect(jobService.createRefundRequest).toHaveBeenCalledWith('seeker-1', expect.objectContaining({ jobId: 'job-1' }));
    expect(result.id).toBe('rr-1');
  });
});