import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { ReviewService } from './review.service';
import { Review } from '../../database/entities/review.entity';
import { Job } from '../../database/entities/job.entity';
import { JobStatus } from '../../database/common/enum';
import { createMockRepository } from '../../../test/helpers/test-factory';
import { DomainEventEmitter } from '../../events/domain-event-emitter.service';
import { ReviewCreatedEvent } from './events/review-created.event';

describe('ReviewService', () => {
  let module: TestingModule;
  let service: ReviewService;
  let reviewRepo: ReturnType<typeof createMockRepository>;
  let jobRepo: ReturnType<typeof createMockRepository>;
  let eventEmitter: { emit: jest.Mock };

  const SEEKER_ID = '00000000-0000-0000-0000-000000000001';
  const PROVIDER_ID = '00000000-0000-0000-0000-000000000002';
  const JOB_ID = '00000000-0000-0000-0000-000000000010';

  function makeJob(overrides: Partial<any> = {}) {
    return {
      id: JOB_ID,
      status: JobStatus.COMPLETED,
      seeker: { id: SEEKER_ID },
      provider: { id: PROVIDER_ID },
      ...overrides,
    };
  }

  beforeEach(async () => {
    reviewRepo = createMockRepository();
    (reviewRepo as any).manager = { query: jest.fn().mockResolvedValue(undefined) };
    jobRepo = createMockRepository();
    (jobRepo as any).manager = { findOne: jest.fn().mockResolvedValue(null) };
    eventEmitter = { emit: jest.fn() };

    module = await Test.createTestingModule({
      providers: [
        ReviewService,
        { provide: getRepositoryToken(Review), useValue: reviewRepo },
        { provide: getRepositoryToken(Job), useValue: jobRepo },
        { provide: DomainEventEmitter, useValue: eventEmitter },
      ],
    }).compile();

    service = module.get<ReviewService>(ReviewService);
  });

  afterEach(() => module.close());

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should throw NotFoundException when job does not exist', async () => {
      jobRepo.findOne.mockResolvedValue(null);

      await expect(service.create(SEEKER_ID, { jobId: JOB_ID } as any)).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when seeker does not own job', async () => {
      jobRepo.findOne.mockResolvedValue(makeJob({ seeker: { id: 'other-seeker' } }));

      await expect(service.create(SEEKER_ID, { jobId: JOB_ID } as any)).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException when job is not completed', async () => {
      jobRepo.findOne.mockResolvedValue(makeJob({ status: JobStatus.IN_PROGRESS }));

      await expect(service.create(SEEKER_ID, { jobId: JOB_ID } as any)).rejects.toThrow(BadRequestException);
    });

    it('should throw ConflictException when a review already exists', async () => {
      jobRepo.findOne.mockResolvedValue(makeJob());
      reviewRepo.findOne.mockResolvedValue({ id: 'existing-review' });

      await expect(service.create(SEEKER_ID, { jobId: JOB_ID } as any)).rejects.toThrow(ConflictException);
    });

    it('should create and save a review for completed job', async () => {
      jobRepo.findOne.mockResolvedValue(makeJob());
      reviewRepo.findOne.mockResolvedValue(null);
      reviewRepo.create.mockImplementation((x: any) => x);
      reviewRepo.save.mockImplementation(async (x: any) => ({ id: 'review-1', ...x }));

      const result = await service.create(SEEKER_ID, {
        jobId: JOB_ID,
        rating: 5,
        comment: 'Great work',
      } as any);

      expect(reviewRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          jobId: JOB_ID,
          seekerId: SEEKER_ID,
          providerId: PROVIDER_ID,
          rating: 5,
        }),
      );
      expect(reviewRepo.save).toHaveBeenCalled();
      expect(result.review.id).toBe('review-1');
    });

    it('should emit ReviewCreatedEvent so the provider stats recompute is queued', async () => {
      // Without this event the cached recommendation / on-time / on-budget rates never update.
      jobRepo.findOne.mockResolvedValue(makeJob());
      reviewRepo.findOne.mockResolvedValue(null);
      reviewRepo.create.mockImplementation((x: any) => x);
      reviewRepo.save.mockImplementation(async (x: any) => ({ id: 'review-1', ...x }));

      await service.create(SEEKER_ID, { jobId: JOB_ID, rating: 5 } as any);

      expect(eventEmitter.emit).toHaveBeenCalledWith(expect.any(ReviewCreatedEvent));
      const event: ReviewCreatedEvent = eventEmitter.emit.mock.calls[0][0];
      expect(event.providerId).toBe(PROVIDER_ID);
      expect(event.reviewId).toBe('review-1');
      expect(event.rating).toBe(5);
    });

    it('should NOT emit when creation is rejected', async () => {
      jobRepo.findOne.mockResolvedValue(makeJob({ status: JobStatus.IN_PROGRESS }));

      await expect(
        service.create(SEEKER_ID, { jobId: JOB_ID, rating: 5 } as any),
      ).rejects.toThrow(BadRequestException);

      expect(eventEmitter.emit).not.toHaveBeenCalled();
    });
  });

  describe('findByProvider', () => {
    it('should return paginated response', async () => {
      reviewRepo.findAndCount.mockResolvedValue([[], 0]);

      const result = await service.findByProvider(PROVIDER_ID, { page: 1, limit: 10 } as any);

      expect(reviewRepo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { providerId: PROVIDER_ID },
        }),
      );
      expect(result.total).toBe(0);
      expect(result.items).toEqual([]);
    });

    it('resolves a provider PROFILE id to the user id before querying reviews', async () => {
      (jobRepo as any).manager.findOne.mockResolvedValue({ user_id: 'provider-user-1' });
      reviewRepo.findAndCount.mockResolvedValue([[], 0]);

      await service.findByProvider('provider-profile-1', { page: 1, limit: 10 } as any);

      expect(reviewRepo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({ where: { providerId: 'provider-user-1' } }),
      );
    });
  });
});