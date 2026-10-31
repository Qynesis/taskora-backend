import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { SelectionService } from './selection.service';
import { Selection } from '../../database/entities/selection.entity';
import { Bid } from '../../database/entities/bid.entity';
import { Job } from '../../database/entities/job.entity';
import { Payment } from '../../database/entities/payment.entity';
import { TransactionHelper } from '../../database/transaction.helper';
import { DomainEventEmitter } from '../../events/domain-event-emitter.service';
import { BidStatus, JobStatus } from '../../database/common/enum';
import { AppCacheService } from '../../cache/cache.service';
import { PlatformFeeService } from '../platform-fee/platform-fee.service';
import {
  createMockRepository,
  createMockEventEmitter,
  createMockPlatformFeeService,
} from '../../../test/helpers/test-factory';

function createMockCacheService() {
  return { delByPrefix: jest.fn().mockResolvedValue(undefined), del: jest.fn().mockResolvedValue(undefined) };
}

const JOB_ID = '00000000-0000-0000-0000-000000000010';
const BID_ID = '00000000-0000-0000-0000-000000000020';
const SEEKER_ID = '00000000-0000-0000-0000-000000000001';
const PROVIDER_ID = '00000000-0000-0000-0000-000000000002';
const SELECTION_ID = '00000000-0000-0000-0000-000000000099';

function makeBaseBid(overrides: Partial<any> = {}): any {
  return {
    id: BID_ID,
    price: 125,       // dollars — e.g. $125.00 AUD
    currency: 'AUD',
    status: BidStatus.SUBMITTED,
    job: { id: JOB_ID, status: JobStatus.BIDDING, seeker: { id: SEEKER_ID } },
    provider: { id: PROVIDER_ID },
    ...overrides,
  };
}

function makeMockManager(bidOrNull: any = makeBaseBid()) {
  return {
    findOne: jest.fn().mockResolvedValue(bidOrNull),
    find: jest.fn().mockResolvedValue([]),
    update: jest.fn().mockResolvedValue(undefined),
    create: jest.fn().mockImplementation((_entity: unknown, data: unknown) => data),
    save: jest.fn().mockResolvedValue({ id: SELECTION_ID }),
  };
}

async function buildModule(
  repository: ReturnType<typeof createMockRepository>,
  eventEmitter: ReturnType<typeof createMockEventEmitter>,
  manager: ReturnType<typeof makeMockManager>,
): Promise<TestingModule> {
  return Test.createTestingModule({
    providers: [
      SelectionService,
      { provide: getRepositoryToken(Selection), useValue: repository },
      { provide: getRepositoryToken(Bid), useValue: createMockRepository() },
      { provide: getRepositoryToken(Job), useValue: createMockRepository() },
      { provide: getRepositoryToken(Payment), useValue: createMockRepository() },
      {
        provide: TransactionHelper,
        useValue: {
          run: jest.fn().mockImplementation(async (cb: (qr: unknown) => Promise<unknown>) =>
            cb({ manager }),
          ),
        },
      },
      { provide: DomainEventEmitter, useValue: eventEmitter },
      { provide: AppCacheService, useValue: createMockCacheService() },
      { provide: PlatformFeeService, useValue: createMockPlatformFeeService() },
    ],
  }).compile();
}

describe('SelectionService', () => {
  let module: TestingModule;
  let service: SelectionService;
  let repository: ReturnType<typeof createMockRepository>;
  let eventEmitter: ReturnType<typeof createMockEventEmitter>;
  let mockManager: ReturnType<typeof makeMockManager>;

  beforeEach(async () => {
    repository = createMockRepository();
    eventEmitter = createMockEventEmitter();
    mockManager = makeMockManager();

    module = await buildModule(repository, eventEmitter, mockManager);
    service = module.get<SelectionService>(SelectionService);
  });

  afterEach(() => module.close());

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a selection, mark bid as ACCEPTED, decline other bids, and update the job', async () => {
      const result = await service.create({ bidId: BID_ID } as any, SEEKER_ID, JOB_ID);

      expect(mockManager.findOne).toHaveBeenCalledWith(Bid, expect.objectContaining({ where: { id: BID_ID } }));

      expect(mockManager.update).toHaveBeenCalledWith(
        Bid,
        { id: BID_ID },
        { status: BidStatus.ACCEPTED },
      );

      expect(mockManager.update).toHaveBeenCalledWith(
        Bid,
        expect.objectContaining({ job: { id: JOB_ID }, status: BidStatus.SUBMITTED }),
        { status: BidStatus.DECLINED },
      );

      expect(mockManager.create).toHaveBeenCalledWith(Selection, expect.objectContaining({
        job: { id: JOB_ID },
        bid: { id: BID_ID },
        provider: { id: PROVIDER_ID },
        selectedBy: { id: SEEKER_ID },
      }));

      expect(mockManager.update).toHaveBeenCalledWith(
        Job,
        { id: JOB_ID },
        expect.objectContaining({ provider: { id: PROVIDER_ID }, selectedBid: { id: BID_ID } }),
      );

      expect(eventEmitter.emit).toHaveBeenCalled();
      expect(result.id).toBe(SELECTION_ID);
    });

    it('should create pending payment with bid price stored as dollars (not cents)', async () => {
      await service.create({ bidId: BID_ID } as any, SEEKER_ID, JOB_ID);

      const createCall = mockManager.create.mock.calls.find(
        ([entity]: [unknown]) => entity === Payment,
      );
      expect(createCall).toBeDefined();
      const paymentData = createCall![1];
      // bid.price = 125 (dollars) → amount must be 125, NOT 12500
      expect(paymentData.amount).toBe(125);
    });

    it('should handle decimal bid prices correctly (e.g. $125.50)', async () => {
      const manager = makeMockManager(makeBaseBid({ price: 125.50 }));
      const m = await buildModule(repository, eventEmitter, manager);
      const svc = m.get<SelectionService>(SelectionService);

      await svc.create({ bidId: BID_ID } as any, SEEKER_ID, JOB_ID);

      const createCall = manager.create.mock.calls.find(
        ([entity]: [unknown]) => entity === Payment,
      );
      expect(createCall![1].amount).toBe(125.50); // money() preserves cents, doesn't round to whole dollars
      await m.close();
    });

    it('should throw NotFoundException when bid does not exist', async () => {
      const manager = makeMockManager(null);
      const m = await buildModule(repository, eventEmitter, manager);
      const svc = m.get<SelectionService>(SelectionService);

      await expect(svc.create({ bidId: BID_ID } as any, SEEKER_ID, JOB_ID)).rejects.toThrow(NotFoundException);
      await m.close();
    });

    it('should throw BadRequestException when bid belongs to a different job', async () => {
      const manager = makeMockManager(makeBaseBid({ job: { id: 'other-job-id', seeker: { id: SEEKER_ID } } }));
      const m = await buildModule(repository, eventEmitter, manager);
      const svc = m.get<SelectionService>(SelectionService);

      await expect(svc.create({ bidId: BID_ID } as any, SEEKER_ID, JOB_ID)).rejects.toThrow(BadRequestException);
      await m.close();
    });

    it('should throw ForbiddenException when caller is not the seeker', async () => {
      const manager = makeMockManager();
      const m = await buildModule(repository, eventEmitter, manager);
      const svc = m.get<SelectionService>(SelectionService);

      await expect(svc.create({ bidId: BID_ID } as any, 'other-user-id', JOB_ID)).rejects.toThrow(ForbiddenException);
      await m.close();
    });

    it('should throw BadRequestException when a provider has already been selected for the job', async () => {
      const manager = makeMockManager(makeBaseBid({ job: { id: JOB_ID, status: JobStatus.SELECTED, seeker: { id: SEEKER_ID } } }));
      const m = await buildModule(repository, eventEmitter, manager);
      const svc = m.get<SelectionService>(SelectionService);

      await expect(svc.create({ bidId: BID_ID } as any, SEEKER_ID, JOB_ID))
        .rejects.toThrow(new BadRequestException('A provider has already been selected for this job'));
      await m.close();
    });

    it('should throw BadRequestException when bid is not in SUBMITTED status', async () => {
      const manager = makeMockManager(makeBaseBid({ status: BidStatus.DECLINED }));
      const m = await buildModule(repository, eventEmitter, manager);
      const svc = m.get<SelectionService>(SelectionService);

      await expect(svc.create({ bidId: BID_ID } as any, SEEKER_ID, JOB_ID)).rejects.toThrow(BadRequestException);
      await m.close();
    });
  });
});
