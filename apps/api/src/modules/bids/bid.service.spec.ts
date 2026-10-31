import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { BidService } from './bid.service';
import { Bid } from '../../database/entities/bid.entity';
import { Job } from '../../database/entities/job.entity';
import { BidStatus, JobStatus } from '../../database/common/enum';
import { BidUpdatedEvent } from './events/bid-updated.event';
import { CreateBidDto } from './dto/create-bid.dto';
import { UpdateBidDto } from './dto/update-bid.dto';
import { BidQueryDto } from './dto/bid-query.dto';
import { DomainEventEmitter } from '../../events/domain-event-emitter.service';
import { createMockRepository, createMockEventEmitter } from '../../../test/helpers/test-factory';

const JOB_ID = '00000000-0000-0000-0000-000000000010';
const BID_ID = '00000000-0000-0000-0000-000000000020';
const PROVIDER_ID = '00000000-0000-0000-0000-000000000001';
const SEEKER_ID = '00000000-0000-0000-0000-000000000002';

function makeProfileQb(profileRow: object | null) {
  const subQuery = {
    select: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    getQuery: jest.fn().mockReturnValue('SELECT 1'),
  };

  return {
    subQuery: jest.fn().mockReturnValue(subQuery),
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    leftJoin: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    getRawOne: jest.fn().mockResolvedValue(profileRow),
  };
}

function makeCompleteProfile() {
  return {
    profileComplete: true,
    workInfoComplete: true,
    professionalDetailsComplete: true,
    hasCategory: true,
    bankDetailsComplete: true,
    hasStripeAccount: true,
    onboardingState: 'enabled',
  };
}

describe('BidService', () => {
  let module: TestingModule;
  let service: BidService;
  let bidRepo: ReturnType<typeof createMockRepository> & { manager: any; findOneBy: jest.Mock };
  let jobRepo: ReturnType<typeof createMockRepository>;
  let eventEmitter: ReturnType<typeof createMockEventEmitter>;

  beforeEach(async () => {
    bidRepo = {
      ...createMockRepository(),
      findOneBy: jest.fn(),
      manager: { createQueryBuilder: jest.fn().mockReturnValue(makeProfileQb(makeCompleteProfile())) },
    } as any;
    jobRepo = createMockRepository();
    eventEmitter = createMockEventEmitter();

    module = await Test.createTestingModule({
      providers: [
        BidService,
        { provide: getRepositoryToken(Bid), useValue: bidRepo },
        { provide: getRepositoryToken(Job), useValue: jobRepo },
        { provide: DomainEventEmitter, useValue: eventEmitter },
      ],
    }).compile();

    service = module.get<BidService>(BidService);
  });

  afterEach(() => module.close());

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ── create ─────────────────────────────────────────────────────────────────

  describe('create', () => {
    const biddingJob = { id: JOB_ID, status: JobStatus.BIDDING, seeker: { id: SEEKER_ID } };

    it('should throw NotFoundException when job does not exist', async () => {
      jobRepo.findOne.mockResolvedValue(null);

      await expect(
        service.create(JOB_ID, PROVIDER_ID, { price: 100 } as CreateBidDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when job is no longer accepting bids', async () => {
      jobRepo.findOne.mockResolvedValue({ id: JOB_ID, status: JobStatus.SELECTED, seeker: { id: SEEKER_ID } });

      await expect(
        service.create(JOB_ID, PROVIDER_ID, { price: 100 } as CreateBidDto),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when provider already has a bid on this job', async () => {
      jobRepo.findOne.mockResolvedValue(biddingJob);
      bidRepo.manager.createQueryBuilder.mockReturnValue(makeProfileQb(makeCompleteProfile()));
      bidRepo.findOne.mockResolvedValue({ id: 'existing-bid' });

      await expect(
        service.create(JOB_ID, PROVIDER_ID, { price: 100 } as CreateBidDto),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when provider personal profile is incomplete', async () => {
      jobRepo.findOne.mockResolvedValue(biddingJob);
      bidRepo.manager.createQueryBuilder.mockReturnValue(
        makeProfileQb({ ...makeCompleteProfile(), profileComplete: false }),
      );

      await expect(
        service.create(JOB_ID, PROVIDER_ID, { price: 100 } as CreateBidDto),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when provider has no bank details', async () => {
      jobRepo.findOne.mockResolvedValue(biddingJob);
      bidRepo.manager.createQueryBuilder.mockReturnValue(
        makeProfileQb({ ...makeCompleteProfile(), bankDetailsComplete: false }),
      );

      await expect(
        service.create(JOB_ID, PROVIDER_ID, { price: 100 } as CreateBidDto),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when provider has no Stripe Connect account', async () => {
      jobRepo.findOne.mockResolvedValue(biddingJob);
      bidRepo.manager.createQueryBuilder.mockReturnValue(
        makeProfileQb({
          ...makeCompleteProfile(),
          hasStripeAccount: false,
          onboardingState: 'not_started',
        }),
      );

      await expect(
        service.create(JOB_ID, PROVIDER_ID, { price: 100 } as CreateBidDto),
      ).rejects.toThrow('Please connect your Stripe payout account before bidding.');
    });

    it('should throw BadRequestException when the Stripe account exists but is not fully enabled', async () => {
      jobRepo.findOne.mockResolvedValue(biddingJob);
      bidRepo.manager.createQueryBuilder.mockReturnValue(
        makeProfileQb({ ...makeCompleteProfile(), onboardingState: 'pending' }),
      );

      await expect(
        service.create(JOB_ID, PROVIDER_ID, { price: 100 } as CreateBidDto),
      ).rejects.toThrow('Your Stripe account is not fully verified yet');
    });

    it('should create a bid and emit BidCreatedEvent when all checks pass', async () => {
      jobRepo.findOne.mockResolvedValue(biddingJob);
      bidRepo.findOne.mockResolvedValue(null);
      bidRepo.manager.createQueryBuilder.mockReturnValue(makeProfileQb(makeCompleteProfile()));
      const savedBid = { id: BID_ID, price: '100.00', currency: 'AUD' };
      bidRepo.create.mockReturnValue(savedBid);
      bidRepo.save.mockResolvedValue(savedBid);

      const result = await service.create(JOB_ID, PROVIDER_ID, { price: 100 } as CreateBidDto);

      expect(bidRepo.save).toHaveBeenCalled();
      expect(eventEmitter.emit).toHaveBeenCalled();
      expect(result.id).toBe(BID_ID);
    });
  });

  // ── findByJob ─────────────────────────────────────────────────────────────

  describe('findByJob', () => {
    const query = { page: 1, limit: 10 } as BidQueryDto;

    it('should throw NotFoundException when job does not exist', async () => {
      jobRepo.findOne.mockResolvedValue(null);

      await expect(service.findByJob(JOB_ID, query, SEEKER_ID)).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when caller is not the job seeker', async () => {
      jobRepo.findOne.mockResolvedValue({ id: JOB_ID, seeker: { id: 'other-seeker' } });

      await expect(service.findByJob(JOB_ID, query, SEEKER_ID)).rejects.toThrow(ForbiddenException);
    });

    it('should return empty page without hitting batch queries when no bids exist', async () => {
      jobRepo.findOne.mockResolvedValue({ id: JOB_ID, seeker: { id: SEEKER_ID } });
      bidRepo.findAndCount.mockResolvedValue([[], 0]);

      const result = await service.findByJob(JOB_ID, query, SEEKER_ID);

      expect(result.total).toBe(0);
      expect(result.items).toHaveLength(0);
    });

    it('should always query only SUBMITTED bids regardless of query params', async () => {
      jobRepo.findOne.mockResolvedValue({ id: JOB_ID, seeker: { id: SEEKER_ID } });
      bidRepo.findAndCount.mockResolvedValue([[], 0]);

      await service.findByJob(JOB_ID, query, SEEKER_ID);

      expect(bidRepo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ status: BidStatus.SUBMITTED }) }),
      );
    });

    function makeWorkInfoQb(rows: { userId: string; businessName: string | null }[]) {
      return {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        from: jest.fn().mockReturnThis(),
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue(rows),
      };
    }

    function makeRatingsQb(rows: { providerId: string; avgRating: string }[]) {
      return {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue(rows),
      };
    }

    function makeConversationQb(rows: { conversationId: string; providerId: string; unreadCount: string }[]) {
      return {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        from: jest.fn().mockReturnThis(),
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        addGroupBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue(rows),
      };
    }

    it('should return bids with business name, avg rating, conversationId and unread count', async () => {
      jobRepo.findOne.mockResolvedValue({ id: JOB_ID, seeker: { id: SEEKER_ID } });

      const bid: any = {
        id: BID_ID,
        price: '200.00',
        currency: 'AUD',
        status: BidStatus.SUBMITTED,
        createdAt: new Date(),
        job: { id: JOB_ID, title: 'Fix pipe', locationText: 'Sydney NSW', serviceDuration: 'single_task', category: { id: 'cat-1', name: 'Plumbing' } },
        provider: { id: PROVIDER_ID, email: 'provider@test.com', profile: { phone: null, avatarUrl: null } },
      };
      bidRepo.findAndCount.mockResolvedValue([[bid], 1]);

      bidRepo.manager.createQueryBuilder
        .mockReturnValueOnce(makeWorkInfoQb([{ userId: PROVIDER_ID, businessName: 'Star Plumbing' }]))
        .mockReturnValueOnce(makeRatingsQb([{ providerId: PROVIDER_ID, avgRating: '4.5' }]))
        .mockReturnValueOnce(makeConversationQb([{ conversationId: 'conv-1', providerId: PROVIDER_ID, unreadCount: '3' }]));

      const result = await service.findByJob(JOB_ID, query, SEEKER_ID);

      expect(result.total).toBe(1);
      expect(result.items[0]!.provider.name).toBe('Star Plumbing');
      expect(result.items[0]!.provider.avgRating).toBe(4.5);
      expect(result.items[0]!.conversationId).toBe('conv-1');
      expect(result.items[0]!.unreadMessageCount).toBe(3);
      expect(result.items[0]!.job.isLongTerm).toBe(false);
      expect(result.items[0]!.job.category).toBe('Plumbing');
    });

    it('should fall back to empty string, zero rating, null conversationId when no data', async () => {
      jobRepo.findOne.mockResolvedValue({ id: JOB_ID, seeker: { id: SEEKER_ID } });

      const bid: any = {
        id: BID_ID,
        price: '150.00',
        currency: 'AUD',
        status: BidStatus.SUBMITTED,
        createdAt: new Date(),
        job: { id: JOB_ID, title: 'Garden work', serviceDuration: '1_month', category: null },
        provider: { id: PROVIDER_ID, email: 'p@test.com', profile: null },
      };
      bidRepo.findAndCount.mockResolvedValue([[bid], 1]);

      bidRepo.manager.createQueryBuilder
        .mockReturnValueOnce(makeWorkInfoQb([{ userId: PROVIDER_ID, businessName: null }]))
        .mockReturnValueOnce(makeRatingsQb([]))
        .mockReturnValueOnce(makeConversationQb([]));

      const result = await service.findByJob(JOB_ID, query, SEEKER_ID);

      expect(result.items[0]!.provider.name).toBe('');
      expect(result.items[0]!.provider.avgRating).toBe(0);
      expect(result.items[0]!.conversationId).toBeNull();
      expect(result.items[0]!.unreadMessageCount).toBe(0);
      expect(result.items[0]!.job.isLongTerm).toBe(true);
      expect(result.items[0]!.job.category).toBeNull();
    });
  });

  // ── decline ───────────────────────────────────────────────────────────────

  describe('decline', () => {
    it('should throw NotFoundException when bid does not exist', async () => {
      bidRepo.findOne.mockResolvedValue(null);

      await expect(service.decline(BID_ID, SEEKER_ID)).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when caller is not the job seeker', async () => {
      bidRepo.findOne.mockResolvedValue({
        id: BID_ID,
        status: BidStatus.SUBMITTED,
        job: { seeker: { id: 'other-seeker' } },
      });

      await expect(service.decline(BID_ID, SEEKER_ID)).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException when bid is not in SUBMITTED status', async () => {
      bidRepo.findOne.mockResolvedValue({
        id: BID_ID,
        status: BidStatus.ACCEPTED,
        job: { seeker: { id: SEEKER_ID } },
      });

      await expect(service.decline(BID_ID, SEEKER_ID)).rejects.toThrow(BadRequestException);
    });

    it('should set status to DECLINED and save', async () => {
      const bid: any = { id: BID_ID, status: BidStatus.SUBMITTED, job: { id: 'job-1', title: 'Test Job', seeker: { id: SEEKER_ID } }, provider: { id: 'provider-1' } };
      bidRepo.findOne.mockResolvedValue(bid);
      bidRepo.save.mockResolvedValue({ ...bid, status: BidStatus.DECLINED });

      const result = await service.decline(BID_ID, SEEKER_ID);

      expect(bidRepo.save).toHaveBeenCalledWith(expect.objectContaining({ status: BidStatus.DECLINED }));
      expect(result.status).toBe(BidStatus.DECLINED);
    });
  });

  // ── findOne ────────────────────────────────────────────────────────────────

  describe('findOne', () => {
    it('should throw NotFoundException when bid does not exist', async () => {
      bidRepo.findOneBy.mockResolvedValue(null);

      await expect(service.findOne('non-existent-id')).rejects.toThrow(NotFoundException);
    });

    it('should return the bid when found', async () => {
      const bid = { id: BID_ID } as Bid;
      bidRepo.findOneBy.mockResolvedValue(bid);

      const result = await service.findOne(BID_ID);

      expect(result).toBe(bid);
    });
  });

  // ── update ─────────────────────────────────────────────────────────────────

  describe('update', () => {
    const biddingBid = (): any => ({
      id: BID_ID,
      price: '100.00',
      currency: 'AUD',
      provider: { id: PROVIDER_ID },
      job: { id: JOB_ID, status: JobStatus.BIDDING, seeker: { id: SEEKER_ID } },
    });

    it('should throw NotFoundException when bid does not exist', async () => {
      bidRepo.findOne.mockResolvedValue(null);

      await expect(service.update('non-existent-id', {} as UpdateBidDto, PROVIDER_ID)).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when provider does not own the bid', async () => {
      bidRepo.findOne.mockResolvedValue(biddingBid());

      await expect(service.update(BID_ID, { price: 150 } as UpdateBidDto, 'other-provider')).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException when job is no longer accepting bid updates', async () => {
      bidRepo.findOne.mockResolvedValue({
        ...biddingBid(),
        job: { id: JOB_ID, status: JobStatus.SELECTED, seeker: { id: SEEKER_ID } },
      });

      await expect(service.update(BID_ID, { price: 150 } as UpdateBidDto, PROVIDER_ID)).rejects.toThrow(BadRequestException);
    });

    it('should update price, save and emit BidUpdatedEvent', async () => {
      const bid = biddingBid();
      bidRepo.findOne.mockResolvedValue(bid);
      bidRepo.save.mockResolvedValue({ ...bid, price: '150.00' });

      const result = await service.update(BID_ID, { price: 150 } as UpdateBidDto, PROVIDER_ID);

      expect(bidRepo.save).toHaveBeenCalledWith(expect.objectContaining({ price: 150 }));
      expect(result.price).toBe('150.00');
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        expect.objectContaining({
          bidId: BID_ID,
          jobId: JOB_ID,
          seekerId: SEEKER_ID,
          providerId: PROVIDER_ID,
        }),
      );
    });

    it('should emit BidUpdatedEvent with custom message when provided', async () => {
      const bid = biddingBid();
      bidRepo.findOne.mockResolvedValue(bid);
      bidRepo.save.mockResolvedValue(bid);

      await service.update(BID_ID, { message: 'Revised my offer' } as UpdateBidDto, PROVIDER_ID);

      expect(eventEmitter.emit).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Revised my offer' }),
      );
    });
  });
});
