import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { SupportTicketService } from './support-ticket.service';
import { SupportTicket } from '../../database/entities/support-ticket.entity';
import { SupportMessage } from '../../database/entities/support-message.entity';
import { SupportSenderType } from '../../database/common/enum';
import { DomainEventEmitter } from '../../events/domain-event-emitter.service';
import { ChatGateway } from '../messages/chat.gateway';
import { createMockEventEmitter, createMockRepository } from '../../../test/helpers/test-factory';

const TICKET_ID = '00000000-0000-0000-0000-000000000010';
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

const mockChatGateway = { broadcastSupportBadge: jest.fn(), broadcastAdminSupportBadge: jest.fn() };

describe('SupportTicketService', () => {
  let module: TestingModule;
  let service: SupportTicketService;
  let ticketRepo: ReturnType<typeof createMockRepository> & { createQueryBuilder: jest.Mock };
  let messageRepo: ReturnType<typeof createMockRepository> & { createQueryBuilder: jest.Mock };
  let eventEmitter: ReturnType<typeof createMockEventEmitter>;

  beforeEach(async () => {
    ticketRepo  = { ...createMockRepository(), createQueryBuilder: jest.fn().mockReturnValue(makeQb()) } as any;
    messageRepo = { ...createMockRepository(), createQueryBuilder: jest.fn().mockReturnValue(makeQb()) } as any;
    eventEmitter = createMockEventEmitter();
    mockChatGateway.broadcastSupportBadge.mockClear();
    mockChatGateway.broadcastAdminSupportBadge.mockClear();

    module = await Test.createTestingModule({
      providers: [
        SupportTicketService,
        { provide: getRepositoryToken(SupportTicket),  useValue: ticketRepo },
        { provide: getRepositoryToken(SupportMessage), useValue: messageRepo },
        { provide: DomainEventEmitter, useValue: eventEmitter },
        { provide: ChatGateway,        useValue: mockChatGateway },
      ],
    }).compile();

    service = module.get<SupportTicketService>(SupportTicketService);
  });

  afterEach(() => module.close());

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ── create ─────────────────────────────────────────────────────────────────

  describe('create', () => {
    it('should create ticket and save initial user message', async () => {
      const createdTicket  = { id: TICKET_ID, subject: 'Need help', createdAt: new Date(), sender: { profile: null, email: 'u@test.com' } };
      const createdMessage = { id: 'm1', body: 'Issue details', createdAt: new Date(), senderType: SupportSenderType.USER };
      ticketRepo.create.mockImplementation((x: any) => x);
      ticketRepo.save.mockResolvedValue(createdTicket);
      messageRepo.create.mockImplementation((x: any) => x);
      messageRepo.save.mockResolvedValue(createdMessage);

      const result = await service.create(USER_ID, { subject: 'Need help', body: 'Issue details' } as any);

      expect(ticketRepo.save).toHaveBeenCalled();
      expect(messageRepo.save).toHaveBeenCalled();
      expect(result.id).toBe(TICKET_ID);
    });

    it('should set readAt on the initial user message', async () => {
      ticketRepo.create.mockImplementation((x: any) => x);
      ticketRepo.save.mockResolvedValue({ id: TICKET_ID, subject: 'S', createdAt: new Date(), sender: { profile: null, email: 'u@test.com' } });
      messageRepo.create.mockImplementation((x: any) => x);
      messageRepo.save.mockResolvedValue({ id: 'm1', body: 'B', createdAt: new Date(), senderType: SupportSenderType.USER });

      await service.create(USER_ID, { subject: 'S', body: 'B' } as any);

      const createdMsg = messageRepo.create.mock.calls[0][0];
      expect(createdMsg.readAt).toBeInstanceOf(Date);
    });
  });

  // ── sendUserMessage ────────────────────────────────────────────────────────

  describe('sendUserMessage', () => {
    it('should throw NotFoundException for missing ticket', async () => {
      ticketRepo.findOne.mockResolvedValue(null);
      await expect(service.sendUserMessage('missing', USER_ID, { body: 'hi' } as any))
        .rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when user is not ticket owner', async () => {
      ticketRepo.findOne.mockResolvedValue({ id: TICKET_ID, sender: { id: 'other' } });
      await expect(service.sendUserMessage(TICKET_ID, USER_ID, { body: 'hi' } as any))
        .rejects.toThrow(BadRequestException);
    });

    it('should save message with readAt set (user reads own message)', async () => {
      ticketRepo.findOne.mockResolvedValue({ id: TICKET_ID, sender: { id: USER_ID } });
      messageRepo.create.mockImplementation((x: any) => x);
      messageRepo.save.mockResolvedValue({ id: 'm1' });
      messageRepo.findOne.mockResolvedValue({
        id: 'm1', senderType: SupportSenderType.USER,
        sender: { email: 'u@test.com', profile: { firstName: 'John', lastName: 'Doe', avatarUrl: null } },
        body: 'hi', attachments: [], createdAt: new Date(),
      });

      await service.sendUserMessage(TICKET_ID, USER_ID, { body: 'hi' } as any);

      const created = messageRepo.create.mock.calls[0][0];
      expect(created.readAt).toBeInstanceOf(Date);
    });
  });

  // ── sendAdminMessage ───────────────────────────────────────────────────────

  describe('sendAdminMessage', () => {
    it('should save admin message with readAt = null', async () => {
      ticketRepo.findOne.mockResolvedValue({ id: TICKET_ID, sender: { id: USER_ID } });
      messageRepo.create.mockImplementation((x: any) => x);
      messageRepo.save.mockResolvedValue({ id: 'm2' });
      messageRepo.findOne.mockResolvedValue({
        id: 'm2', senderType: SupportSenderType.ADMIN,
        sender: { email: 'a@admin.com', profile: { firstName: 'Admin', lastName: '', avatarUrl: null } },
        body: 'We are looking into it', attachments: [], createdAt: new Date(),
      });

      await service.sendAdminMessage(TICKET_ID, ADMIN_ID, { body: 'We are looking into it' } as any);

      const created = messageRepo.create.mock.calls[0][0];
      expect(created.readAt).toBeNull();
    });
  });

  // ── unreadCount ────────────────────────────────────────────────────────────

  describe('unreadCount', () => {
    it('should return count from query builder', async () => {
      const qb = makeQb();
      qb.getCount.mockResolvedValue(3);
      messageRepo.createQueryBuilder.mockReturnValue(qb);

      const result = await service.unreadCount(USER_ID);

      expect(result).toBe(3);
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

  // ── adminUnreadCount ───────────────────────────────────────────────────────

  describe('adminUnreadCount', () => {
    it('should return the awaiting-reply queue count from the ticket query builder', async () => {
      const qb = makeQb();
      qb.getCount.mockResolvedValue(4);
      ticketRepo.createQueryBuilder.mockReturnValue(qb);

      const result = await service.adminUnreadCount();

      expect(result).toBe(4);
      expect(ticketRepo.createQueryBuilder).toHaveBeenCalled();
      expect(qb.where).toHaveBeenCalledWith('last_msg.sender_type = :userType', { userType: SupportSenderType.USER });
    });
  });

  describe('create → admin badge', () => {
    it('should push the admin support badge when a ticket is created', async () => {
      ticketRepo.create.mockImplementation((x: any) => x);
      ticketRepo.save.mockResolvedValue({ id: TICKET_ID, subject: 'S', createdAt: new Date(), sender: { profile: null, email: 'u@test.com' } });
      messageRepo.create.mockImplementation((x: any) => x);
      messageRepo.save.mockResolvedValue({ id: 'm1', body: 'B', createdAt: new Date(), senderType: SupportSenderType.USER });
      const qb = makeQb();
      qb.getCount.mockResolvedValue(2);
      ticketRepo.createQueryBuilder.mockReturnValue(qb);

      await service.create(USER_ID, { subject: 'S', body: 'B' } as any);

      expect(mockChatGateway.broadcastAdminSupportBadge).toHaveBeenCalledWith(2);
    });
  });

  // ── markMessagesAsRead ─────────────────────────────────────────────────────

  describe('markMessagesAsRead', () => {
    it('should silently return when ticket does not exist', async () => {
      ticketRepo.findOne.mockResolvedValue(null);

      await expect(service.markMessagesAsRead(TICKET_ID, USER_ID)).resolves.toBeUndefined();
      expect(messageRepo.createQueryBuilder).not.toHaveBeenCalled();
    });

    it('should silently return when user is not ticket owner', async () => {
      ticketRepo.findOne.mockResolvedValue({ id: TICKET_ID, sender: { id: 'other' } });

      await expect(service.markMessagesAsRead(TICKET_ID, USER_ID)).resolves.toBeUndefined();
      expect(messageRepo.createQueryBuilder).not.toHaveBeenCalled();
    });

    it('should bulk-update unread admin messages', async () => {
      ticketRepo.findOne.mockResolvedValue({ id: TICKET_ID, sender: { id: USER_ID } });
      const qb = makeQb();
      messageRepo.createQueryBuilder.mockReturnValue(qb);

      await service.markMessagesAsRead(TICKET_ID, USER_ID);

      expect(qb.update).toHaveBeenCalled();
      expect(qb.set).toHaveBeenCalledWith(expect.objectContaining({ readAt: expect.any(Date) }));
      expect(qb.execute).toHaveBeenCalled();
    });

    it('should push updated badge count via socket after marking read', async () => {
      ticketRepo.findOne.mockResolvedValue({ id: TICKET_ID, sender: { id: USER_ID } });
      const updateQb = makeQb();
      const countQb  = makeQb();
      countQb.getCount.mockResolvedValue(0);
      messageRepo.createQueryBuilder
        .mockReturnValueOnce(updateQb)
        .mockReturnValueOnce(countQb);

      await service.markMessagesAsRead(TICKET_ID, USER_ID);

      expect(mockChatGateway.broadcastSupportBadge).toHaveBeenCalledWith(USER_ID, 0);
    });
  });
});
