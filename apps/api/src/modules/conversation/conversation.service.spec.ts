import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { ConversationService } from './conversation.service';
import { Conversation } from '../../database/entities/conversation.entity';
import { DirectMessage } from '../../database/entities/direct-message.entity';
import { User } from '../../database/entities/user.entity';
import { MessageModerationService } from './message-moderation.service';
import { DomainEventEmitter } from '../../events/domain-event-emitter.service';
import { SendMessageDto } from './dto/send-message.dto';
import { ConversationQueryDto } from './dto/conversation-query.dto';
import { UserRole } from '../../database/common/enum';
import {
  createMockRepository,
  createMockEventEmitter,
} from '../../../test/helpers/test-factory';

const CONV_ID = '00000000-0000-0000-0000-000000000010';
const SEEKER_ID = '00000000-0000-0000-0000-000000000001';
const PROVIDER_ID = '00000000-0000-0000-0000-000000000002';
const OUTSIDER_ID = '00000000-0000-0000-0000-000000000099';
const MSG_ID = '00000000-0000-0000-0000-000000000020';

function makeConversation(seekerId = SEEKER_ID, providerId = PROVIDER_ID) {
  return {
    id: CONV_ID,
    seeker: { id: seekerId, role: UserRole.SEEKER, email: 'seeker@test.com', profile: { firstName: 'John', lastName: 'Doe', avatarUrl: null } },
    provider: { id: providerId, role: UserRole.PROVIDER, email: 'provider@test.com', profile: { firstName: 'Jane', lastName: 'Smith', avatarUrl: null } },
  };
}

function makeMessageQb() {
  const qb: any = {
    update: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    execute: jest.fn().mockResolvedValue({}),
  };
  return qb;
}

describe('ConversationService', () => {
  let module: TestingModule;
  let service: ConversationService;
  let conversationRepo: ReturnType<typeof createMockRepository>;
  let messageRepo: ReturnType<typeof createMockRepository> & { createQueryBuilder: jest.Mock; manager: any };
  let userRepo: ReturnType<typeof createMockRepository>;
  let moderation: { validate: jest.Mock };
  let eventEmitter: ReturnType<typeof createMockEventEmitter>;

  beforeEach(async () => {
    conversationRepo = createMockRepository();
    messageRepo = {
      ...createMockRepository(),
      createQueryBuilder: jest.fn().mockReturnValue(makeMessageQb()),
      manager: {
        createQueryBuilder: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnThis(),
          addSelect: jest.fn().mockReturnThis(),
          from: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          getRawOne: jest.fn().mockResolvedValue(null),
        }),
      },
    } as any;
    userRepo = createMockRepository();
    moderation = { validate: jest.fn() };
    eventEmitter = createMockEventEmitter();

    module = await Test.createTestingModule({
      providers: [
        ConversationService,
        { provide: getRepositoryToken(Conversation), useValue: conversationRepo },
        { provide: getRepositoryToken(DirectMessage), useValue: messageRepo },
        { provide: getRepositoryToken(User), useValue: userRepo },
        { provide: MessageModerationService, useValue: moderation },
        { provide: DomainEventEmitter, useValue: eventEmitter },
      ],
    }).compile();

    service = module.get<ConversationService>(ConversationService);
  });

  afterEach(() => module.close());

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ── sendMessage ────────────────────────────────────────────────────────────

  describe('sendMessage', () => {
    it('should throw NotFoundException when conversation does not exist', async () => {
      conversationRepo.findOne.mockResolvedValue(null);

      await expect(
        service.sendMessage(CONV_ID, SEEKER_ID, { body: 'hello' } as SendMessageDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when sender is not a participant', async () => {
      conversationRepo.findOne.mockResolvedValue(makeConversation());

      await expect(
        service.sendMessage(CONV_ID, OUTSIDER_ID, { body: 'hello' } as SendMessageDto),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw UnprocessableEntityException when message fails moderation', async () => {
      moderation.validate.mockImplementation(() => {
        throw new UnprocessableEntityException('contains email');
      });

      await expect(
        service.sendMessage(CONV_ID, SEEKER_ID, { body: 'contact me@example.com' } as SendMessageDto),
      ).rejects.toThrow(UnprocessableEntityException);
    });

    it('should persist message and emit event when all checks pass', async () => {
      conversationRepo.findOne.mockResolvedValue(makeConversation());
      const savedMsg = { id: MSG_ID, body: 'hello' };
      messageRepo.create.mockReturnValue(savedMsg);
      messageRepo.save.mockResolvedValue(savedMsg);
      messageRepo.findOne.mockResolvedValue({
        id: MSG_ID,
        body: 'hello',
        isRead: false,
        sender: { id: SEEKER_ID, role: UserRole.SEEKER, email: 'seeker@test.com', profile: { firstName: 'John', lastName: 'Doe', avatarUrl: null } },
        job: null,
        createdAt: new Date(),
      });

      const result = await service.sendMessage(CONV_ID, SEEKER_ID, { body: 'hello' } as SendMessageDto);

      expect(messageRepo.save).toHaveBeenCalled();
      expect(eventEmitter.emit).toHaveBeenCalled();
      expect(result.id).toBe(MSG_ID);
    });
  });

  // ── findMessages ───────────────────────────────────────────────────────────

  describe('findMessages', () => {
    it('should throw NotFoundException when conversation does not exist', async () => {
      conversationRepo.findOne.mockResolvedValue(null);

      await expect(
        service.findMessages(CONV_ID, SEEKER_ID, new ConversationQueryDto()),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when user is not a participant', async () => {
      conversationRepo.findOne.mockResolvedValue(makeConversation());

      await expect(
        service.findMessages(CONV_ID, OUTSIDER_ID, new ConversationQueryDto()),
      ).rejects.toThrow(BadRequestException);
    });

    it('should return paginated messages for a participant', async () => {
      conversationRepo.findOne.mockResolvedValue(makeConversation());
      messageRepo.findAndCount.mockResolvedValue([[], 0]);

      const result = await service.findMessages(CONV_ID, SEEKER_ID, new ConversationQueryDto());

      expect(result.total).toBe(0);
      expect(result.items).toEqual([]);
    });
  });

  // ── markRead ───────────────────────────────────────────────────────────────

  describe('markRead', () => {
    it('should throw NotFoundException when conversation does not exist', async () => {
      conversationRepo.findOne.mockResolvedValue(null);

      await expect(service.markRead(CONV_ID, SEEKER_ID)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when user is not a participant', async () => {
      conversationRepo.findOne.mockResolvedValue(makeConversation());

      await expect(service.markRead(CONV_ID, OUTSIDER_ID)).rejects.toThrow(BadRequestException);
    });

    it('should execute bulk update for participant', async () => {
      conversationRepo.findOne.mockResolvedValue(makeConversation());
      const qb = makeMessageQb();
      messageRepo.createQueryBuilder.mockReturnValue(qb);

      await service.markRead(CONV_ID, SEEKER_ID);

      expect(messageRepo.createQueryBuilder).toHaveBeenCalled();
      expect(qb.update).toHaveBeenCalled();
      expect(qb.execute).toHaveBeenCalled();
    });
  });
});
