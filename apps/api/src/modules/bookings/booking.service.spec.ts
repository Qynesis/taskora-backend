import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BookingService } from './booking.service';
import { Job } from '../../database/entities/job.entity';
import { JobPhoto } from '../../database/entities/job-photo.entity';
import { Conversation } from '../../database/entities/conversation.entity';
import { EngagementType, JobStatus, JobType } from '../../database/common/enum';
import { TransactionHelper } from '../../database/transaction.helper';
import { DomainEventEmitter } from '../../events/domain-event-emitter.service';
import {
  createMockRepository,
  createMockEventEmitter,
} from '../../../test/helpers/test-factory';

const BOOKING_ID = '00000000-0000-0000-0000-000000000010';
const SEEKER_ID = '00000000-0000-0000-0000-000000000001';
const PROVIDER_ID = '00000000-0000-0000-0000-000000000002';
const CATEGORY_ID = '00000000-0000-0000-0000-000000000003';
const PROFILE_ID = '00000000-0000-0000-0000-000000000004';

function makeJob(overrides: Partial<any> = {}): any {
  return {
    id: BOOKING_ID,
    type: JobType.DIRECT,
    description: 'Clean my apartment',
    category: { id: CATEGORY_ID, name: 'Cleaning' },
    locationText: 'Sydney NSW',
    engagement: EngagementType.SINGLE,
    durationMonths: null,
    status: JobStatus.PENDING,
    photos: [{ fileUrl: 'https://cdn.example.com/1.jpg', sortOrder: 0 }],
    seeker: {
      id: SEEKER_ID,
      email: 'seeker@test.com',
      profile: { firstName: 'John', lastName: 'Doe', avatarUrl: null },
    },
    provider: {
      id: PROVIDER_ID,
      email: 'provider@test.com',
      profile: { firstName: 'Jane', lastName: 'Smith', avatarUrl: null },
    },
    createdAt: new Date('2026-03-30T00:00:00Z'),
    ...overrides,
  };
}

function makeTxHelper() {
  return {
    run: jest.fn().mockImplementation(async (cb: (qr: any) => Promise<unknown>) => {
      const manager = {
        save: jest.fn().mockImplementation(async (data: any) => {
          if (Array.isArray(data)) return data;
          return { id: BOOKING_ID, ...data };
        }),
      };
      return cb({ manager });
    }),
  };
}

describe('BookingService', () => {
  let module: TestingModule;
  let service: BookingService;
  let jobRepo: ReturnType<typeof createMockRepository>;
  let jobPhotoRepo: ReturnType<typeof createMockRepository>;
  let conversationRepo: ReturnType<typeof createMockRepository>;
  let txHelper: ReturnType<typeof makeTxHelper>;
  let eventEmitter: ReturnType<typeof createMockEventEmitter>;

  beforeEach(async () => {
    jobRepo = createMockRepository();
    (jobRepo as any).manager = { findOne: jest.fn() };
    jobPhotoRepo = createMockRepository();
    conversationRepo = createMockRepository();
    txHelper = makeTxHelper();
    eventEmitter = createMockEventEmitter();

    module = await Test.createTestingModule({
      providers: [
        BookingService,
        { provide: getRepositoryToken(Job), useValue: jobRepo },
        { provide: getRepositoryToken(JobPhoto), useValue: jobPhotoRepo },
        { provide: getRepositoryToken(Conversation), useValue: conversationRepo },
        { provide: TransactionHelper, useValue: txHelper },
        { provide: DomainEventEmitter, useValue: eventEmitter },
      ],
    }).compile();

    service = module.get<BookingService>(BookingService);
  });

  afterEach(() => module.close());

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const dto = {
      providerProfileId: PROFILE_ID,
      description: 'Clean my apartment',
      categoryId: CATEGORY_ID,
      locationText: 'Sydney NSW',
      engagement: EngagementType.SINGLE,
      photos: [{ fileUrl: 'https://cdn.example.com/1.jpg', sortOrder: 0 }],
    };

    it('should create booking, persist photos, and emit BookingCreatedEvent', async () => {
      (jobRepo as any).manager.findOne.mockResolvedValue({ id: PROFILE_ID, user: { id: PROVIDER_ID } });
      jobRepo.create.mockImplementation((payload: any) => payload);
      jobPhotoRepo.create.mockImplementation((payload: any) => payload);

      const result = await service.create(SEEKER_ID, dto as any);

      expect(txHelper.run).toHaveBeenCalled();
      expect(jobRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          type: JobType.DIRECT,
          status: JobStatus.PENDING,
          description: 'Clean my apartment',
          provider: { id: PROVIDER_ID },
        }),
      );
      expect(jobPhotoRepo.create).toHaveBeenCalledTimes(1);
      expect(eventEmitter.emit).toHaveBeenCalledTimes(1);
      expect(result.id).toBe(BOOKING_ID);
    });

    it('should throw NotFoundException when providerProfileId does not exist', async () => {
      (jobRepo as any).manager.findOne.mockResolvedValue(null);

      await expect(service.create(SEEKER_ID, dto as any)).rejects.toThrow(NotFoundException);
    });
  });

  describe('cancelBySeeker', () => {
    it('should throw NotFoundException when booking does not exist', async () => {
      jobRepo.findOne.mockResolvedValue(null);

      await expect(service.cancelBySeeker(SEEKER_ID, BOOKING_ID)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when booking is not pending', async () => {
      jobRepo.findOne.mockResolvedValue(makeJob({ status: JobStatus.COMPLETED }));

      await expect(service.cancelBySeeker(SEEKER_ID, BOOKING_ID)).rejects.toThrow(BadRequestException);
    });

    it('should cancel pending booking and return updated detail', async () => {
      jobRepo.findOne
        .mockResolvedValueOnce(makeJob({ status: JobStatus.PENDING }))
        .mockResolvedValueOnce(makeJob({ status: JobStatus.CANCELLED }));
      jobRepo.save.mockImplementation(async (job: any) => job);

      const result = await service.cancelBySeeker(SEEKER_ID, BOOKING_ID);

      expect(jobRepo.save).toHaveBeenCalledWith(expect.objectContaining({ status: JobStatus.CANCELLED }));
      expect(result.status).toBe(JobStatus.CANCELLED);
    });
  });

  describe('updateStatus', () => {
    it('should throw BadRequestException for invalid status transition', async () => {
      jobRepo.findOne.mockResolvedValue(makeJob({ status: JobStatus.IN_PROGRESS }));

      await expect(
        service.updateStatus(PROVIDER_ID, BOOKING_ID, JobStatus.COMPLETED),
      ).rejects.toThrow(BadRequestException);
    });

    it('should update provider booking status from pending', async () => {
      jobRepo.findOne
        .mockResolvedValueOnce(makeJob({ status: JobStatus.PENDING }))
        .mockResolvedValueOnce(makeJob({ status: JobStatus.IN_PROGRESS }));
      jobRepo.save.mockImplementation(async (job: any) => job);

      const result = await service.updateStatus(PROVIDER_ID, BOOKING_ID, JobStatus.IN_PROGRESS);

      expect(jobRepo.save).toHaveBeenCalledWith(expect.objectContaining({ status: JobStatus.IN_PROGRESS }));
    });
  });
});