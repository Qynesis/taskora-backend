import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { NotificationService } from './notification.service';
import { Notification } from '../../database/entities/notification.entity';
import { FcmToken } from '../../database/entities/fcm-token.entity';
import { UserNotificationSettings } from '../../database/entities/user_notification_settings.entity';
import { User } from '../../database/entities/user.entity';
import { ChatGateway } from '../messages/chat.gateway';
import { AppCacheService } from '../../cache/cache.service';
import { NotificationQueryDto } from './dto/notification-query.dto';
import { NotificationType, FcmPlatform } from '../../database/common/enum';
import { createMockRepository } from '../../../test/helpers/test-factory';

const mockChatGateway = {
  broadcastNotificationBadge: jest.fn(),
};

const USER_ID = '00000000-0000-0000-0000-000000000001';
const OTHER_USER_ID = '00000000-0000-0000-0000-000000000002';
const NOTIF_ID = '00000000-0000-0000-0000-000000000010';

function makeQb() {
  const qb: any = {
    delete: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    execute: jest.fn().mockResolvedValue({}),
  };
  return qb;
}

function makeNotification(overrides: Partial<any> = {}): any {
  return {
    id: NOTIF_ID,
    title: 'Test title',
    body: 'Test body',
    type: NotificationType.NEW_MESSAGE,
    data: null,
    readAt: null,
    sentAt: null,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    ...overrides,
  };
}

describe('NotificationService', () => {
  let module: TestingModule;
  let service: NotificationService;
  let notifRepo: ReturnType<typeof createMockRepository> & { createQueryBuilder: jest.Mock };
  let fcmRepo: ReturnType<typeof createMockRepository> & { createQueryBuilder: jest.Mock };
  let settingsRepo: ReturnType<typeof createMockRepository>;
  let cacheMock: { delByPrefix: jest.Mock; del: jest.Mock };

  beforeEach(async () => {
    notifRepo = { ...createMockRepository(), createQueryBuilder: jest.fn().mockReturnValue(makeQb()), count: jest.fn().mockResolvedValue(0) } as any;
    fcmRepo = { ...createMockRepository(), createQueryBuilder: jest.fn().mockReturnValue(makeQb()) } as any;
    settingsRepo = createMockRepository();
    cacheMock = { delByPrefix: jest.fn(), del: jest.fn() };

    module = await Test.createTestingModule({
      providers: [
        NotificationService,
        { provide: getRepositoryToken(Notification), useValue: notifRepo },
        { provide: getRepositoryToken(FcmToken), useValue: fcmRepo },
        { provide: getRepositoryToken(UserNotificationSettings), useValue: settingsRepo },
        { provide: getRepositoryToken(User), useValue: createMockRepository() },
        {
          provide: ConfigService,
          useValue: { get: jest.fn().mockReturnValue(undefined) }, // FCM disabled
        },
        { provide: ChatGateway, useValue: mockChatGateway },
        { provide: AppCacheService, useValue: cacheMock },
      ],
    }).compile();

    service = module.get<NotificationService>(NotificationService);
  });

  afterEach(() => module.close());

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ── registerToken ──────────────────────────────────────────────────────────

  describe('registerToken', () => {
    it('should create a new token when none exists', async () => {
      fcmRepo.findOne.mockResolvedValue(null);
      fcmRepo.create.mockReturnValue({ token: 'fcm-tok', platform: FcmPlatform.IOS });
      fcmRepo.save.mockResolvedValue({ id: 'tok-id' });

      await service.registerToken(USER_ID, { token: 'fcm-tok', platform: FcmPlatform.IOS });

      expect(fcmRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ token: 'fcm-tok', platform: FcmPlatform.IOS }),
      );
      expect(fcmRepo.save).toHaveBeenCalled();
    });

    it('should not save when token already belongs to the same user', async () => {
      fcmRepo.findOne.mockResolvedValue({ user: { id: USER_ID }, token: 'fcm-tok', platform: null });

      await service.registerToken(USER_ID, { token: 'fcm-tok' });

      expect(fcmRepo.save).not.toHaveBeenCalled();
    });

    it('should reassign and save when token belongs to a different user', async () => {
      const existing: any = { user: { id: OTHER_USER_ID }, token: 'fcm-tok', platform: null };
      fcmRepo.findOne.mockResolvedValue(existing);
      fcmRepo.save.mockResolvedValue(existing);

      await service.registerToken(USER_ID, { token: 'fcm-tok', platform: FcmPlatform.ANDROID });

      expect(fcmRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ platform: FcmPlatform.ANDROID }),
      );
    });
  });

  // ── removeToken ────────────────────────────────────────────────────────────

  describe('removeToken', () => {
    it('should delete the token via query builder', async () => {
      const qb = makeQb();
      fcmRepo.createQueryBuilder.mockReturnValue(qb);

      await service.removeToken(USER_ID, 'fcm-tok');

      expect(fcmRepo.createQueryBuilder).toHaveBeenCalled();
      expect(qb.delete).toHaveBeenCalled();
      expect(qb.where).toHaveBeenCalled();
      expect(qb.execute).toHaveBeenCalled();
    });
  });

  // ── send ───────────────────────────────────────────────────────────────────

  describe('send', () => {
    it('should persist a notification record', async () => {
      const record = makeNotification();
      notifRepo.create.mockReturnValue(record);
      notifRepo.save.mockResolvedValue(record);

      await service.send({
        userId: USER_ID,
        title: 'Test title',
        body: 'Test body',
        type: NotificationType.NEW_MESSAGE,
      });

      expect(notifRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Test title',
          body: 'Test body',
          type: NotificationType.NEW_MESSAGE,
          readAt: null,
          sentAt: null,
        }),
      );
      expect(notifRepo.save).toHaveBeenCalled();
    });

    it('should invalidate the user\'s cached notification list so the new one shows immediately', async () => {
      const record = makeNotification();
      notifRepo.create.mockReturnValue(record);
      notifRepo.save.mockResolvedValue(record);

      await service.send({ userId: USER_ID, title: 'T', body: 'B', type: NotificationType.NEW_MESSAGE });

      expect(cacheMock.delByPrefix).toHaveBeenCalledWith(`notifications:list:${USER_ID}:`);
    });

    it('should skip FCM dispatch when firebaseApp is null (no credentials configured)', async () => {
      const record = makeNotification();
      notifRepo.create.mockReturnValue(record);
      notifRepo.save.mockResolvedValue(record);

      await service.send({ userId: USER_ID, title: 'T', body: 'B', type: NotificationType.BID_RECEIVED });

      // firebaseApp is null → returns early, never fetches tokens
      expect(fcmRepo.find).not.toHaveBeenCalled();
    });

    // FCM configured so the push path is reached; each test sets the settings + type it exercises.
    const enableFcm = () => {
      (service as any).firebaseApp = { messaging: () => ({ sendEachForMulticast: jest.fn() }) };
      const record = makeNotification();
      notifRepo.create.mockReturnValue(record);
      notifRepo.save.mockResolvedValue(record);
      fcmRepo.find.mockResolvedValue([]);
    };

    it('should skip a non-message push when pushEnabled is off (but still save the in-app record)', async () => {
      enableFcm();
      settingsRepo.findOne.mockResolvedValue({ pushEnabled: false, messageAlertsEnabled: true });

      await service.send({ userId: USER_ID, title: 'T', body: 'B', type: NotificationType.BID_RECEIVED });

      expect(notifRepo.save).toHaveBeenCalled();
      expect(fcmRepo.find).not.toHaveBeenCalled();
    });

    it('should send a non-message push when pushEnabled is on', async () => {
      enableFcm();
      settingsRepo.findOne.mockResolvedValue({ pushEnabled: true, messageAlertsEnabled: false });

      await service.send({ userId: USER_ID, title: 'T', body: 'B', type: NotificationType.BID_RECEIVED });

      expect(fcmRepo.find).toHaveBeenCalled();
    });

    it('should skip a new-message push when messageAlertsEnabled is off — even if pushEnabled is on', async () => {
      enableFcm();
      settingsRepo.findOne.mockResolvedValue({ pushEnabled: true, messageAlertsEnabled: false });

      await service.send({ userId: USER_ID, title: 'New message', body: 'hi', type: NotificationType.NEW_MESSAGE });

      expect(fcmRepo.find).not.toHaveBeenCalled();
    });

    it('should send a new-message push when messageAlertsEnabled is on — even if pushEnabled is off', async () => {
      enableFcm();
      settingsRepo.findOne.mockResolvedValue({ pushEnabled: false, messageAlertsEnabled: true });

      await service.send({ userId: USER_ID, title: 'New message', body: 'hi', type: NotificationType.NEW_MESSAGE });

      expect(fcmRepo.find).toHaveBeenCalled();
    });

    it('should include extra data in the notification record when provided', async () => {
      const record = makeNotification({ data: { jobId: 'job-1' } });
      notifRepo.create.mockReturnValue(record);
      notifRepo.save.mockResolvedValue(record);

      await service.send({
        userId: USER_ID,
        title: 'T',
        body: 'B',
        type: NotificationType.JOB_STARTED,
        data: { jobId: 'job-1' },
      });

      expect(notifRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: { jobId: 'job-1' } }),
      );
    });
  });

  // ── findForUser ────────────────────────────────────────────────────────────

  describe('findForUser', () => {
    it('should return a paginated list of notifications', async () => {
      const notifications = [makeNotification()];
      notifRepo.findAndCount.mockResolvedValue([notifications, 1]);

      const result = await service.findForUser(USER_ID, new NotificationQueryDto());

      expect(result.total).toBe(1);
      expect(result.items).toHaveLength(1);
      expect(result.items[0]?.id).toBe(NOTIF_ID);
    });

    it('should return an empty page when user has no notifications', async () => {
      notifRepo.findAndCount.mockResolvedValue([[], 0]);

      const result = await service.findForUser(USER_ID, new NotificationQueryDto());

      expect(result.total).toBe(0);
      expect(result.items).toEqual([]);
    });
  });

  // ── markRead ───────────────────────────────────────────────────────────────

  describe('markRead', () => {
    it('should call repository update with a readAt timestamp', async () => {
      notifRepo.update.mockResolvedValue(undefined);

      await service.markRead(NOTIF_ID, USER_ID);

      expect(notifRepo.update).toHaveBeenCalledWith(
        expect.objectContaining({ id: NOTIF_ID }),
        expect.objectContaining({ readAt: expect.any(Date) }),
      );
    });
  });

  // ── markAllRead ────────────────────────────────────────────────────────────

  describe('markAllRead', () => {
    it('should bulk-update unread notifications via query builder', async () => {
      const qb = makeQb();
      notifRepo.createQueryBuilder.mockReturnValue(qb);

      await service.markAllRead(USER_ID);

      expect(notifRepo.createQueryBuilder).toHaveBeenCalled();
      expect(qb.update).toHaveBeenCalled();
      expect(qb.set).toHaveBeenCalled();
      expect(qb.where).toHaveBeenCalled();
      expect(qb.execute).toHaveBeenCalled();
    });
  });
});
