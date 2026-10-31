import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from '../../database/entities/user.entity';
import { UserNotificationSettings } from '../../database/entities/user_notification_settings.entity';
import { UserRole } from '../../database/common/enum';
import { DomainEventEmitter } from '../../events/domain-event-emitter.service';
import { AuditService } from '../audit/audit.service';
import {
  createMockRepository,
  createMockEventEmitter,
} from '../../../test/helpers/test-factory';

describe('UsersService', () => {
  let module: TestingModule;
  let service: UsersService;
  let userRepo: ReturnType<typeof createMockRepository> & { findOneBy: jest.Mock; upsert: jest.Mock };
  let settingsRepo: ReturnType<typeof createMockRepository>;
  let eventEmitter: ReturnType<typeof createMockEventEmitter>;

  beforeEach(async () => {
    userRepo = {
      ...createMockRepository(),
      findOneBy: jest.fn(),
      upsert: jest.fn().mockResolvedValue(undefined),
    } as any;
    settingsRepo = createMockRepository();
    eventEmitter = createMockEventEmitter();

    module = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useValue: userRepo },
        { provide: getRepositoryToken(UserNotificationSettings), useValue: settingsRepo },
        { provide: DomainEventEmitter, useValue: eventEmitter },
        { provide: AuditService, useValue: { log: jest.fn(), findAll: jest.fn(), findOne: jest.fn() } },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  afterEach(() => module.close());

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('upsert', () => {
    it('should upsert user and emit event on new user', async () => {
      // findOneBy: email check → null, id check before → null (new), id check after → saved user
      userRepo.findOneBy
        .mockResolvedValueOnce(null)                                           // email owner check
        .mockResolvedValueOnce(null)                                           // before (isNew = true)
        .mockResolvedValueOnce({ id: 'u1', email: 'u1@test.com', emailVerified: true, role: UserRole.SEEKER }); // after upsert

      const result = await service.upsert('u1', 'u1@test.com', true, UserRole.SEEKER);

      expect(userRepo.upsert).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'u1', email: 'u1@test.com', emailVerified: true }),
        expect.objectContaining({ conflictPaths: ['id'] }),
      );
      expect(eventEmitter.emit).toHaveBeenCalled();
      expect(result.id).toBe('u1');
    });

    it('should upsert user and return updated record on email change', async () => {
      const updated = { id: 'u1', email: 'new@test.com', emailVerified: true, role: UserRole.SEEKER };
      userRepo.findOneBy
        .mockResolvedValueOnce(null)                        // email owner check
        .mockResolvedValueOnce({ id: 'u1', email: 'old@test.com' }) // before (isNew = false)
        .mockResolvedValueOnce(updated);                    // after upsert

      const result = await service.upsert('u1', 'new@test.com', true);

      expect(userRepo.upsert).toHaveBeenCalled();
      expect(result.email).toBe('new@test.com');
    });
  });

  describe('ensureSynced', () => {
    it('should map JWT claims to an idempotent upsert', async () => {
      userRepo.findOneBy
        .mockResolvedValueOnce(null)                                           // email owner check
        .mockResolvedValueOnce(null)                                           // before (isNew = true)
        .mockResolvedValueOnce({ id: 'u1', email: 'u1@test.com', emailVerified: true, role: UserRole.PROVIDER }); // after upsert

      const result = await service.ensureSynced({
        id: 'u1',
        email: 'u1@test.com',
        roles: ['provider'],
        metadata: { email_confirmed_at: '2026-01-01T00:00:00Z', user_metadata: { role: 'provider' } },
      } as any);

      expect(userRepo.upsert).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'u1', email: 'u1@test.com', emailVerified: true, role: 'provider' }),
        expect.objectContaining({ conflictPaths: ['id'] }),
      );
      expect(result.id).toBe('u1');
    });
  });

  describe('findOne', () => {
    it('should throw when user is missing', async () => {
      userRepo.findOneBy.mockResolvedValue(null);
      await expect(service.findOne('missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getNotificationSettings', () => {
    it('should create default settings when not found', async () => {
      settingsRepo.findOne.mockResolvedValue(null);
      settingsRepo.create.mockImplementation((x: any) => x);
      settingsRepo.save.mockImplementation(async (x: any) => ({ id: 's1', ...x }));

      const result = await service.getNotificationSettings('u1');

      expect(settingsRepo.create).toHaveBeenCalledWith({ user: { id: 'u1' } });
      expect(result.id).toBe('s1');
    });
  });
});