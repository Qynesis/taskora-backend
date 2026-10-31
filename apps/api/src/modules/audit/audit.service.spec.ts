import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { AuditService } from './audit.service';
import { AuditLog } from '../../database/entities/audit-log.entity';
import { AuditQueryDto } from './dto/audit-query.dto';
import { createMockRepository } from '../../../test/helpers/test-factory';

const AUDIT_ID = '00000000-0000-0000-0000-000000000001';
const ENTITY_ID = '00000000-0000-0000-0000-000000000002';
const ACTOR_ID = '00000000-0000-0000-0000-000000000003';

describe('AuditService', () => {
  let module: TestingModule;
  let service: AuditService;
  let repository: ReturnType<typeof createMockRepository>;

  beforeEach(async () => {
    repository = createMockRepository();

    module = await Test.createTestingModule({
      providers: [
        AuditService,
        { provide: getRepositoryToken(AuditLog), useValue: repository },
      ],
    }).compile();

    service = module.get<AuditService>(AuditService);
  });

  afterEach(() => module.close());

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('log', () => {
    it('should create and save an audit record with actor', async () => {
      const saved = { id: AUDIT_ID, action: 'JOB_CREATED', entityType: 'job', entityId: ENTITY_ID };
      repository.create.mockReturnValue(saved);
      repository.save.mockResolvedValue(saved);

      await service.log({
        action: 'JOB_CREATED',
        entityType: 'job',
        entityId: ENTITY_ID,
        actorId: ACTOR_ID,
        metadata: { title: 'Fix my plumbing' },
      });

      expect(repository.create).toHaveBeenCalledWith(expect.objectContaining({
        action: 'JOB_CREATED',
        entityType: 'job',
        entityId: ENTITY_ID,
        actor: { id: ACTOR_ID },
        metadata: { title: 'Fix my plumbing' },
      }));
      expect(repository.save).toHaveBeenCalledWith(saved);
    });

    it('should set actor to null when actorId is not provided', async () => {
      const saved = { id: AUDIT_ID, action: 'JOB_CREATED', entityType: 'job', entityId: ENTITY_ID };
      repository.create.mockReturnValue(saved);
      repository.save.mockResolvedValue(saved);

      await service.log({
        action: 'JOB_CREATED',
        entityType: 'job',
        entityId: ENTITY_ID,
      });

      expect(repository.create).toHaveBeenCalledWith(expect.objectContaining({
        actor: null,
        metadata: null,
      }));
    });
  });

  describe('findAll', () => {
    it('should return paginated results', async () => {
      repository.findAndCount.mockResolvedValue([[], 0]);

      const result = await service.findAll(new AuditQueryDto());

      expect(result.items).toEqual([]);
      expect(result.total).toBe(0);
      expect(repository.findAndCount).toHaveBeenCalled();
    });

    it('should pass page and limit to the query', async () => {
      repository.findAndCount.mockResolvedValue([[], 0]);

      const query = Object.assign(new AuditQueryDto(), { page: 2, limit: 5 });
      await service.findAll(query);

      expect(repository.findAndCount).toHaveBeenCalledWith(expect.objectContaining({
        skip: 5,
        take: 5,
      }));
    });
  });

  describe('findOne', () => {
    it('should return the audit log when found', async () => {
      const record = { id: AUDIT_ID, action: 'BID_PLACED', entityType: 'bid', entityId: ENTITY_ID };
      repository.findOneBy.mockResolvedValue(record);

      const result = await service.findOne(AUDIT_ID);

      expect(result).toEqual(record);
      expect(repository.findOneBy).toHaveBeenCalledWith({ id: AUDIT_ID });
    });

    it('should throw NotFoundException when not found', async () => {
      repository.findOneBy.mockResolvedValue(null);

      await expect(service.findOne('non-existent-id')).rejects.toThrow(NotFoundException);
    });

  });
});
