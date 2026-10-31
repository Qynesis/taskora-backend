import { BadRequestException, GoneException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Conversation } from '../../database/entities/conversation.entity';
import { DirectMessage } from '../../database/entities/direct-message.entity';
import { ProviderWorkInfo } from '../../database/entities/provider_work_info.entity';
import { Profile } from '../../database/entities/profile.entity';
import { User } from '../../database/entities/user.entity';
import { UserRole } from '../../database/common/enum';
import { DomainEventEmitter } from '../../events/domain-event-emitter.service';
import { DirectMessageCreatedEvent } from './events/direct-message-created.event';
import { MessageModerationService } from './message-moderation.service';
import { AttachmentDto } from '../../interfaces/attachment.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { StartConversationDto } from './dto/start-conversation.dto';
import { MessageResponseDto, JobPreviewDto } from './dto/message-response.dto';
import { ConversationListItemDto } from './dto/conversation-list-item.dto';
import { ConversationQueryDto } from './dto/conversation-query.dto';
import { PaginatedResponseDto } from '../../interfaces/paginated-response.dto';

@Injectable()
export class ConversationService {
  constructor(
    @InjectRepository(Conversation)
    private readonly conversationRepository: Repository<Conversation>,
    @InjectRepository(DirectMessage)
    private readonly messageRepository: Repository<DirectMessage>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly moderation: MessageModerationService,
    private readonly eventEmitter: DomainEventEmitter,
  ) {}

  // ── Public API ─────────────────────────────────────────────────────────────

  async startConversation(
    senderId: string,
    dto: StartConversationDto,
  ): Promise<ConversationListItemDto> {
    this.moderation.validate(dto.body);

    const [sender, recipient] = await Promise.all([
      this.userRepository.findOne({ where: { id: senderId } as any, relations: { profile: true } }),
      this.userRepository.findOne({ where: { id: dto.recipientId } as any, relations: { profile: true } }),
    ]);

    if (!sender || !recipient) throw new NotFoundException('User not found');
    if (recipient.accountDeletedAt) {
      throw new GoneException('This account has been deleted. You can no longer message this user.');
    }

    const { seekerId, providerId } = this.resolvePair(sender, recipient);

    const conversation = await this.findOrCreateConversation(seekerId, providerId);
    await this.persistMessage(conversation.id, senderId, dto.body, dto.jobId);

    const bizRow = await this.conversationRepository.manager
      .createQueryBuilder()
      .select('wi.businessName', 'businessName')
      .from(ProviderWorkInfo, 'wi')
      .where('wi.profile_id = :providerId', { providerId })
      .getRawOne<{ businessName: string | null }>();

    return this.toListItem(conversation, senderId, bizRow?.businessName ?? null);
  }

  async sendMessage(
    conversationId: string,
    senderId: string,
    dto: SendMessageDto,
  ): Promise<MessageResponseDto> {
    this.moderation.validate(dto.body);

    const conversation = await this.conversationRepository.findOne({
      where: { id: conversationId } as any,
      relations: { seeker: true, provider: true },
    });
    if (!conversation) throw new NotFoundException('Conversation not found');

    const isParticipant =
      conversation.seeker.id === senderId || conversation.provider.id === senderId;
    if (!isParticipant) throw new BadRequestException('Access denied');

    // Block messaging a counterparty who has deleted their account (tombstoned, shown as "Deleted User").
    const other =
      conversation.seeker.id === senderId ? conversation.provider : conversation.seeker;
    if (other.accountDeletedAt) {
      throw new GoneException('This account has been deleted. You can no longer message this user.');
    }

    const msg = await this.persistMessage(conversationId, senderId, dto.body, dto.jobId, dto.attachments);
    const response = await this.toMessageResponse(msg.id);

    const recipientId =
      conversation.seeker.id === senderId
        ? conversation.provider.id
        : conversation.seeker.id;

    this.eventEmitter.emit(
      new DirectMessageCreatedEvent(conversationId, response, recipientId),
    );

    return response;
  }

  async sendBidMessage(
    seekerId: string,
    providerId: string,
    jobId: string,
    body: string,
  ): Promise<void> {
    const conversation = await this.findOrCreateConversation(seekerId, providerId);
    const msg = await this.persistMessage(conversation.id, providerId, body, jobId);
    const response = await this.toMessageResponse(msg.id);

    this.eventEmitter.emit(
      new DirectMessageCreatedEvent(conversation.id, response, seekerId),
    );
  }

  /**
   * Display name for the "other" participant in a conversation, scrubbing to "Deleted User" for a
   * counterparty who has deleted their account (their profile is a tombstone and their business
   * name is purged, so the normal fallbacks would otherwise surface the anonymized email).
   */
  private otherParticipantName(
    other: { accountDeletedAt?: Date | null; email: string },
    otherProfile: { firstName?: string; lastName?: string } | null | undefined,
    isSeeker: boolean,
    providerBizName: string | null,
  ): string {
    if (other.accountDeletedAt) return 'Deleted User';
    return isSeeker
      ? (providerBizName || other.email)
      : ([otherProfile?.firstName, otherProfile?.lastName].filter(Boolean).join(' ') || other.email);
  }

  async findInbox(
    userId: string,
    query: ConversationQueryDto,
  ): Promise<PaginatedResponseDto<ConversationListItemDto>> {
    const qb = this.conversationRepository
      .createQueryBuilder('c')
      .innerJoinAndSelect('c.seeker', 'seeker')
      .innerJoinAndSelect('seeker.profile', 'seekerProfile')
      .innerJoinAndSelect('c.provider', 'provider')
      .innerJoinAndSelect('provider.profile', 'providerProfile')
      .leftJoin(ProviderWorkInfo, 'pwi', 'pwi.profile_id = providerProfile.id')
      .addSelect('pwi.businessName', 'providerBizName')
      .where('(c.seeker_id = :userId OR c.provider_id = :userId)', { userId })
      .leftJoin(
        (sub) =>
          sub
            .select('dm.conversation_id', 'convId')
            .addSelect('dm.body', 'body')
            .addSelect('dm.created_at', 'createdAt')
            .addSelect('dm.sender_id', 'senderId')
            .from(DirectMessage, 'dm')
            .where((sqb) => {
              const latestMessageSubQuery = sqb
                .subQuery()
                .select('dmLatest.id')
                .from(DirectMessage, 'dmLatest')
                .where('dmLatest.conversation_id = dm.conversation_id')
                .orderBy('dmLatest.created_at', 'DESC')
                .limit(1)
                .getQuery();
              return `dm.id = ${latestMessageSubQuery}`;
            }),
        'lastMsg',
        '"lastMsg"."convId" = c.id',
      )
      .addSelect('"lastMsg".body', 'lastMsgBody')
      .addSelect('"lastMsg"."createdAt"', 'lastMsgCreatedAt')
      .addSelect('"lastMsg"."senderId"', 'lastMsgSenderId')
      .leftJoin(
        (sub) =>
          sub
            .select('dm2.conversation_id', 'convId')
            .addSelect('COUNT(dm2.id)', 'count')
            .from(DirectMessage, 'dm2')
            .where('dm2.sender_id != :userId AND dm2.is_read = false', { userId })
            .groupBy('dm2.conversation_id'),
        'unread',
        'unread."convId" = c.id',
      )
      .addSelect('COALESCE(unread.count, 0)', 'unreadCount')
      .orderBy(`COALESCE("lastMsg"."createdAt", c.created_at)`, 'DESC')
      .limit(query.limit)
      .offset((query.page - 1) * query.limit);

    if (query.search) {
      const search = `%${query.search}%`;
      qb.andWhere(
        `(
          (c.seeker_id = :userId AND (
            pwi.business_name ILIKE :search
            OR provider.email ILIKE :search
          ))
          OR
          (c.provider_id = :userId AND (
            CONCAT(COALESCE(seekerProfile.first_name, ''), ' ', COALESCE(seekerProfile.last_name, '')) ILIKE :search
            OR seeker.email ILIKE :search
          ))
        )`,
        { search },
      );
    }

    const total = await qb.clone().getCount();
    const { entities, raw } = await qb.getRawAndEntities();

    const items: ConversationListItemDto[] = entities.map((conv, i) => {
      const isSeeker = conv.seeker.id === userId;
      const other = isSeeker ? conv.provider : conv.seeker;
      const otherProfile = isSeeker ? conv.provider.profile : conv.seeker.profile;
      const providerBizName: string | null = raw[i]?.providerBizName ?? null;
      const otherName = this.otherParticipantName(other, otherProfile, isSeeker, providerBizName);

      const lastMsgBody: string | null = raw[i]?.lastMsgBody ?? null;
      const lastMsgCreatedAt: string | null = raw[i]?.lastMsgCreatedAt ?? null;
      const lastMsgSenderId: string | null = raw[i]?.lastMsgSenderId ?? null;
      const unreadCount = parseInt(raw[i]?.unreadCount ?? '0', 10);

      return {
        id: conv.id,
        otherParticipant: {
          id: other.id,
          name: otherName,
          avatarUrl: other.accountDeletedAt ? null : (otherProfile?.avatarUrl ?? null),
          role: other.role,
          isDeleted: !!other.accountDeletedAt,
        },
        lastMessage: lastMsgBody
          ? {
              body: lastMsgBody,
              createdAt: lastMsgCreatedAt!,
              isFromMe: lastMsgSenderId === userId,
            }
          : null,
        unreadCount,
      };
    });

    return new PaginatedResponseDto(items, total, query.page, query.limit);
  }

  async getConversationDetail(
    conversationId: string,
    userId: string,
  ): Promise<{ name: string | null; email: string; avatarUrl: string | null; isDeleted: boolean }> {
    const conversation = await this.conversationRepository.findOne({
      where: { id: conversationId } as any,
      relations: { seeker: { profile: true }, provider: { profile: true } },
    });
    if (!conversation) throw new NotFoundException('Conversation not found');

    const isParticipant =
      conversation.seeker.id === userId || conversation.provider.id === userId;
    if (!isParticipant) throw new BadRequestException('Access denied');

    const isSeeker = conversation.seeker.id === userId;
    const other = isSeeker ? conversation.provider : conversation.seeker;
    const otherProfile = isSeeker ? conversation.provider.profile : conversation.seeker.profile;

    let providerBizName: string | null = null;
    if (isSeeker) {
      const row = await this.conversationRepository.manager
        .createQueryBuilder()
        .select('wi.businessName', 'businessName')
        .from(ProviderWorkInfo, 'wi')
        .innerJoin(Profile, 'p', 'p.id = wi.profile_id')
        .where('p.user_id = :userId', { userId: other.id })
        .getRawOne<{ businessName: string | null }>();
      providerBizName = row?.businessName ?? null;
    }

    const name = this.otherParticipantName(other, otherProfile, isSeeker, providerBizName);
    const deleted = !!other.accountDeletedAt;

    return {
      name,
      email: deleted ? '' : other.email,
      avatarUrl: deleted ? null : (otherProfile?.avatarUrl ?? null),
      isDeleted: deleted,
    };
  }

  async findMessages(
    conversationId: string,
    userId: string,
    query: ConversationQueryDto,
  ): Promise<PaginatedResponseDto<MessageResponseDto>> {
    const conversation = await this.conversationRepository.findOne({
      where: { id: conversationId } as any,
      relations: { seeker: true, provider: true },
    });
    if (!conversation) throw new NotFoundException('Conversation not found');

    const isParticipant =
      conversation.seeker.id === userId || conversation.provider.id === userId;
    if (!isParticipant) throw new BadRequestException('Access denied');

    const allowedSortFields = new Set(['createdAt', 'id']);
    const sortBy = allowedSortFields.has(query.sortBy) ? query.sortBy : 'createdAt';
    const order = query.order ?? 'DESC';
    if (!allowedSortFields.has(query.sortBy)) {
      throw new BadRequestException('Invalid sortBy field');
    }

    const orderBy = sortBy === 'createdAt'
      ? { createdAt: order, id: order }
      : { id: order };

    const [messages, total] = await this.messageRepository.findAndCount({
      where: { conversation: { id: conversationId } } as any,
      relations: { sender: { profile: true }, job: { category: true } },
      order: orderBy,
      take: query.limit,
      skip: (query.page - 1) * query.limit,
    });

    const providerSenderIds = [...new Set(
      messages.filter((m) => m.sender.role === UserRole.PROVIDER).map((m) => m.sender.id),
    )];
    const bizNameMap = new Map<string, string | null>();
    if (providerSenderIds.length > 0) {
      const rows = await this.messageRepository.manager
        .createQueryBuilder()
        .select('wi.profile_id', 'userId')
        .addSelect('wi.business_name', 'businessName')
        .from(ProviderWorkInfo, 'wi')
        .where('wi.profile_id IN (:...ids)', { ids: providerSenderIds })
        .getRawMany<{ userId: string; businessName: string | null }>();
      rows.forEach((r) => bizNameMap.set(r.userId, r.businessName));
    }

    const items = messages.map((m) =>
      this.mapMessage(m, m.sender.role === UserRole.PROVIDER ? (bizNameMap.get(m.sender.id) ?? null) : null),
    );
    return new PaginatedResponseDto(items, total, query.page, query.limit);
  }

  async markRead(conversationId: string, userId: string): Promise<void> {
    const conversation = await this.conversationRepository.findOne({
      where: { id: conversationId } as any,
      relations: { seeker: true, provider: true },
    });
    if (!conversation) throw new NotFoundException('Conversation not found');

    const isParticipant =
      conversation.seeker.id === userId || conversation.provider.id === userId;
    if (!isParticipant) throw new BadRequestException('Access denied');

    await this.messageRepository
      .createQueryBuilder()
      .update()
      .set({ isRead: true })
      .where('conversation_id = :conversationId AND sender_id != :userId AND is_read = false', {
        conversationId,
        userId,
      })
      .execute();
  }

  async unreadMessageCount(userId: string): Promise<number> {
    return this.messageRepository
      .createQueryBuilder('dm')
      .innerJoin('dm.conversation', 'c')
      .where('(c.seeker_id = :userId OR c.provider_id = :userId)', { userId })
      .andWhere('dm.sender_id != :userId', { userId })
      .andWhere('dm.is_read = false')
      .getCount();
  }

  // ── Internal ───────────────────────────────────────────────────────────────

  private async findOrCreateConversation(
    seekerId: string,
    providerId: string,
  ): Promise<Conversation> {
    const existing = await this.conversationRepository.findOne({
      where: { seeker: { id: seekerId }, provider: { id: providerId } } as any,
      relations: { seeker: true, provider: true },
    });
    if (existing) return existing;

    const created = this.conversationRepository.create({
      seeker: { id: seekerId },
      provider: { id: providerId },
    });
    return this.conversationRepository.save(created);
  }

  private async persistMessage(
    conversationId: string,
    senderId: string,
    body: string,
    jobId?: string,
    attachments?: AttachmentDto[],
  ): Promise<DirectMessage> {
    const msg = this.messageRepository.create({
      conversation: { id: conversationId },
      sender: { id: senderId },
      body,
      attachments: attachments ?? [],
      ...(jobId ? { job: { id: jobId } } : {}),
    });
    return this.messageRepository.save(msg);
  }

  private async toMessageResponse(messageId: string): Promise<MessageResponseDto> {
    const msg = await this.messageRepository.findOne({
      where: { id: messageId } as any,
      relations: { sender: { profile: true }, job: { category: true } },
    });

    let providerBizName: string | null = null;
    if (msg!.sender.role === UserRole.PROVIDER) {
      const row = await this.messageRepository.manager
        .createQueryBuilder()
        .select('wi.businessName', 'businessName')
        .from(ProviderWorkInfo, 'wi')
        .where('wi.profile_id = :id', { id: msg!.sender.id })
        .getRawOne<{ businessName: string | null }>();
      providerBizName = row?.businessName ?? null;
    }

    return this.mapMessage(msg!, providerBizName);
  }

  private mapMessage(m: DirectMessage, providerBizName?: string | null): MessageResponseDto {
    const senderName = m.sender.accountDeletedAt
      ? 'Deleted User'
      : m.sender.role === UserRole.PROVIDER
        ? (providerBizName || m.sender.email)
        : ([m.sender.profile?.firstName, m.sender.profile?.lastName].filter(Boolean).join(' ') || m.sender.email);

    let jobPreview: JobPreviewDto | null = null;
    if (m.job) {
      jobPreview = {
        id: m.job.id,
        title: m.job.title ?? '',
        budgetPrice: m.job.budgetPrice ?? null,
        locationText: m.job.locationText ?? null,
        category: m.job.category ? { id: m.job.category.id, name: m.job.category.name } : null,
      };
    }

    return {
      id: m.id,
      senderId: m.sender.id,
      senderName: senderName ?? '',
      senderAvatarUrl: m.sender.profile?.avatarUrl ?? null,
      body: m.body,
      isRead: m.isRead,
      jobPreview,
      createdAt: m.createdAt.toISOString(),
      attachments: m.attachments ?? [],
    };
  }

  private resolvePair(
    userA: User,
    userB: User,
  ): { seekerId: string; providerId: string } {
    if (userA.role === UserRole.SEEKER && userB.role === UserRole.PROVIDER) {
      return { seekerId: userA.id, providerId: userB.id };
    }
    if (userA.role === UserRole.PROVIDER && userB.role === UserRole.SEEKER) {
      return { seekerId: userB.id, providerId: userA.id };
    }
    throw new BadRequestException('Conversations are only allowed between a seeker and a provider.');
  }

  private toListItem(
    conversation: Conversation,
    currentUserId: string,
    providerBizName?: string | null,
  ): ConversationListItemDto {
    const isSeeker = conversation.seeker.id === currentUserId;
    const other = isSeeker ? conversation.provider : conversation.seeker;
    const otherProfile = isSeeker ? conversation.provider.profile : conversation.seeker.profile;
    const otherName = this.otherParticipantName(other, otherProfile, isSeeker, providerBizName ?? null);

    return {
      id: conversation.id,
      otherParticipant: {
        id: other.id,
        name: otherName,
        avatarUrl: other.accountDeletedAt ? null : (otherProfile?.avatarUrl ?? null),
        role: other.role,
        isDeleted: !!other.accountDeletedAt,
      },
      lastMessage: null,
      unreadCount: 0,
    };
  }
}
