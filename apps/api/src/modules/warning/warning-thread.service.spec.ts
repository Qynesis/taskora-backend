import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { WarningThreadService } from './warning-thread.service';
import { WarningThread } from '../../database/entities/warning-thread.entity';
import { WarningMessage } from '../../database/entities/warning-message.entity';
import { UserWarning } from '../../database/entities/user-warning.entity';
import { WarningSenderType } from '../../database/common/enum';
import { DomainEventEmitter } from '../../events/domain-event-emitter.service';
import { ChatGateway } from '../messages/chat.gateway';
import { createMockEventEmitter, createMockRepository } from '../../../test/helpers/test-factory';

const THREAD_ID = '00000000-0000-0000-0000-000000000020';
const USER_ID   = '00000000-0000-0000-0000-000000000001';
const ADMIN_ID  = '00000000-0000-0000-0000-000000000002';

function makeQb() {
  const qb: any = {
    innerJoin:  jest.fn().mockReturnThis(),
    where:      jest.fn().mockReturnThis(),
    andWhere:   jest.fn().mockReturnThis(),
    update:     jest.fn().mockReturnThis(),
    set:        jest.fn().mockReturnThis(),
    execute:    jest.fn().mockResolvedValue({}),
    getCount:   jest.fn().mockResolvedValue(0),
  };
  return qb;
}

const mockChatGateway = { broadcastWarningBadge: jest.fn() };

describe('WarningThreadService', () => {
  let module: TestingModule;
  let service: WarningThreadService;
  let threadRepo: ReturnType<typeof createMockRepository> & { createQueryBuilder: jest.Mock };
  let messageRepo: ReturnType<typeof createMockRepository> & { createQueryBuilder: jest.Mock };
  let warningRepo: ReturnType<typeof createMockRepository>;
  let eventEmitter: ReturnType<typeof createMockEventEmitter>;

  beforeEach(async () => {
    threadRepo  = { ...createMockRepository(), createQueryBuilder: jest.fn().mockReturnValue(makeQb()) } as any;
    messageRepo = { ...createMockRepository(), createQueryBuilder: jest.fn().mockReturnValue(makeQb()) } as any;
    warningRepo = createMockRepository();
    eventEmitter = createMockEventEmitter();
    mockChatGateway.broadcastWarningBadge.mockClear();

    module = await Test.createTestingModule({
      providers: [
        WarningThreadService,
        { provide: getRepositoryToken(WarningThread),  useValue: threadRepo },
        { provide: getRepositoryToken(WarningMessage), useValue: messageRepo },
        { provide: getRepositoryToken(UserWarning),    useValue: warningRepo },
        { provide: DomainEventEmitter, useValue: eventEmitter },
        { provide: ChatGateway,        useValue: mockChatGateway },
      ],
    }).compile();

    service = module.get<WarningThreadService>(WarningThreadService);
  });

  afterEach(() => module.close());

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ── createForWarning ───────────────────────────────────────────────────────

  describe('createForWarning', () => {
    it('should create thread with initial admin message', async () => {
      const savedThread   = { id: THREAD_ID };
      const savedMessage  = { id: 'msg1' };
      threadRepo.create.mockImplementation((x: any) => x);
      threadRepo.save.mockResolvedValue(savedThread);
      messageRepo.create.mockImplementation((x: any) => x);
      messageRepo.save.mockResolvedValue(savedMessage);

      const result = await service.createForWarning('w1', USER_ID, ADMIN_ID, 'Please respond');

      expect(threadRepo.save).toHaveBeenCalled();
      expect(messageRepo.save).toHaveBeenCalled();
      expect(result).toEqual({ thread: savedThread, firstMessage: savedMessage });
    });
  });

  // ── sendUserMessage ────────────────────────────────────────────────────────

  describe('sendUserMessage', () => {
    it('should throw NotFoundException when thread does not exist', async () => {
      threadRepo.findOne.mockResolvedValue(null);

      await expect(service.sendUserMessage('missing', USER_ID, { body: 'hi' } as any))
        .rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when requester is not the recipient', async () => {
      threadRepo.findOne.mockResolvedValue({ id: THREAD_ID, recipient: { id: 'owner' }, isClosed: false });

      await expect(service.sendUserMessage(THREAD_ID, USER_ID, { body: 'hi' } as any))
        .rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException when thread is closed', async () => {
      threadRepo.findOne.mockResolvedValue({ id: THREAD_ID, recipient: { id: USER_ID }, isClosed: true });

      await expect(service.sendUserMessage(THREAD_ID, USER_ID, { body: 'hi' } as any))
        .rejects.toThrow(BadRequestException);
    });

    it('should persist user message with readAt set and emit event', async () => {
      threadRepo.findOne.mockResolvedValue({ id: THREAD_ID, recipient: { id: USER_ID }, isClosed: false });
      messageRepo.create.mockImplementation((x: any) => x);
      messageRepo.save.mockResolvedValue({ id: 'm1' });
      messageRepo.findOne.mockResolvedValue({
        id: 'm1',
        senderType: WarningSenderType.USER,
        sender: { email: 'u@test.com', profile: { firstName: 'John', lastName: 'Doe', avatarUrl: null } },
        body: 'hello',
        attachments: [],
        createdAt: new Date('2026-03-30T00:00:00.000Z'),
      });

      const result = await service.sendUserMessage(THREAD_ID, USER_ID, { body: 'hello' } as any);

      const created = messageRepo.create.mock.calls[0][0];
      expect(created.readAt).toBeInstanceOf(Date);
      expect(result.id).toBe('m1');
      expect(eventEmitter.emit).toHaveBeenCalled();
    });
  });

  // ── sendAdminMessage ───────────────────────────────────────────────────────

  describe('sendAdminMessage', () => {
    it('should persist admin message with readAt = null and emit event', async () => {
      threadRepo.findOne.mockResolvedValue({ id: THREAD_ID, recipient: { id: USER_ID }, isClosed: false });
      messageRepo.create.mockImplementation((x: any) => x);
      messageRepo.save.mockResolvedValue({ id: 'm2' });
      messageRepo.findOne.mockResolvedValue({
        id: 'm2',
        senderType: WarningSenderType.ADMIN,
        sender: { email: 'a@admin.com', profile: { firstName: 'Admin', lastName: '', avatarUrl: null } },
        body: 'We have reviewed',
        attachments: [],
        createdAt: new Date(),
      });

      await service.sendAdminMessage(THREAD_ID, ADMIN_ID, { body: 'We have reviewed' } as any);

      const created = messageRepo.create.mock.calls[0][0];
      expect(created.readAt).toBeNull();
      expect(eventEmitter.emit).toHaveBeenCalled();
    });

    it('should emit event with recipientId and senderType', async () => {
      threadRepo.findOne.mockResolvedValue({ id: THREAD_ID, recipient: { id: USER_ID }, isClosed: false });
      messageRepo.create.mockImplementation((x: any) => x);
      messageRepo.save.mockResolvedValue({ id: 'm2' });
      messageRepo.findOne.mockResolvedValue({
        id: 'm2',
        senderType: WarningSenderType.ADMIN,
        sender: { email: 'a@admin.com', profile: { firstName: 'Admin', lastName: '', avatarUrl: null } },
        body: 'Reply from admin',
        attachments: [],
        createdAt: new Date(),
      });

      await service.sendAdminMessage(THREAD_ID, ADMIN_ID, { body: 'Reply from admin' } as any);

      const emittedEvent = eventEmitter.emit.mock.calls[0][0];
      expect(emittedEvent.recipientId).toBe(USER_ID);
      expect(emittedEvent.senderType).toBe(WarningSenderType.ADMIN);
    });
  });

  // ── unreadCount ────────────────────────────────────────────────────────────

  describe('unreadCount', () => {
    it('should return count from query builder', async () => {
      const qb = makeQb();
      qb.getCount.mockResolvedValue(5);
      messageRepo.createQueryBuilder.mockReturnValue(qb);

      const result = await service.unreadCount(USER_ID);

      expect(result).toBe(5);
      expect(messageRepo.createQueryBuilder).toHaveBeenCalled();
      expect(qb.innerJoin).toHaveBeenCalled();
      expect(qb.andWhere).toHaveBeenCalledWith('msg.read_at IS NULL');
    });

    it('should return 0 when no unread messages', async () => {
      const qb = makeQb();
      qb.getCount.mockResolvedValue(0);
      messageRepo.createQueryBuilder.mockReturnValue(qb);

      expect(await service.unreadCount(USER_ID)).toBe(0);
    });
  });

  describe('adminUnreadCount', () => {
    it('should count open threads awaiting an admin reply from the thread query builder', async () => {
      const qb = makeQb();
      qb.getCount.mockResolvedValue(3);
      threadRepo.createQueryBuilder.mockReturnValue(qb);

      const result = await service.adminUnreadCount();

      expect(result).toBe(3);
      expect(threadRepo.createQueryBuilder).toHaveBeenCalled();
      expect(qb.where).toHaveBeenCalledWith('last_msg.sender_type = :userType', { userType: WarningSenderType.USER });
      expect(qb.andWhere).toHaveBeenCalledWith('t.is_closed = false');
    });
  });

  // ── markMessagesAsRead ─────────────────────────────────────────────────────

  describe('markMessagesAsRead', () => {
    it('should silently return when thread does not exist', async () => {
      threadRepo.findOne.mockResolvedValue(null);

      await expect(service.markMessagesAsRead(THREAD_ID, USER_ID)).resolves.toBeUndefined();
      expect(messageRepo.createQueryBuilder).not.toHaveBeenCalled();
    });

    it('should silently return when user is not thread recipient', async () => {
      threadRepo.findOne.mockResolvedValue({ id: THREAD_ID, recipient: { id: 'other' } });

      await expect(service.markMessagesAsRead(THREAD_ID, USER_ID)).resolves.toBeUndefined();
      expect(messageRepo.createQueryBuilder).not.toHaveBeenCalled();
    });

    it('should bulk-update unread admin messages', async () => {
      threadRepo.findOne.mockResolvedValue({ id: THREAD_ID, recipient: { id: USER_ID } });
      const qb = makeQb();
      messageRepo.createQueryBuilder.mockReturnValue(qb);

      await service.markMessagesAsRead(THREAD_ID, USER_ID);

      expect(qb.update).toHaveBeenCalled();
      expect(qb.set).toHaveBeenCalledWith(expect.objectContaining({ readAt: expect.any(Date) }));
      expect(qb.execute).toHaveBeenCalled();
    });

    it('should push updated badge count via socket after marking read', async () => {
      threadRepo.findOne.mockResolvedValue({ id: THREAD_ID, recipient: { id: USER_ID } });
      const updateQb = makeQb();
      const countQb  = makeQb();
      countQb.getCount.mockResolvedValue(2);
      messageRepo.createQueryBuilder
        .mockReturnValueOnce(updateQb)
        .mockReturnValueOnce(countQb);

      await service.markMessagesAsRead(THREAD_ID, USER_ID);

      expect(mockChatGateway.broadcastWarningBadge).toHaveBeenCalledWith(USER_ID, 2);
    });
  });
});
