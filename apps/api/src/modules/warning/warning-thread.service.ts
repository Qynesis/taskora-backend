import { BadRequestException, ForbiddenException, GoneException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WarningThread } from '../../database/entities/warning-thread.entity';
import { WarningMessage } from '../../database/entities/warning-message.entity';
import { UserWarning } from '../../database/entities/user-warning.entity';
import { ProviderWorkInfo } from '../../database/entities/provider_work_info.entity';
import { Profile } from '../../database/entities/profile.entity';
import { UserRole, WarningSenderType } from '../../database/common/enum';
import { DomainEventEmitter } from '../../events/domain-event-emitter.service';
import { WarningMessageCreatedEvent } from './events/warning-message-created.event';
import { WarningThreadResponseDto } from './dto/warning-thread-response.dto';
import { WarningMessageResponseDto } from './dto/warning-message-response.dto';
import { WarningRepliesItemDto } from './dto/warning-replies-item.dto';
import { WarningThreadQueryDto } from './dto/warning-thread-query.dto';
import { SendWarningMessageDto } from './dto/send-warning-message.dto';
import { PaginatedResponseDto } from '../../interfaces/paginated-response.dto';
import { ChatGateway } from '../messages/chat.gateway';

@Injectable()
export class WarningThreadService {
  constructor(
    @InjectRepository(WarningThread)
    private readonly threadRepository: Repository<WarningThread>,
    @InjectRepository(WarningMessage)
    private readonly messageRepository: Repository<WarningMessage>,
    @InjectRepository(UserWarning)
    private readonly warningRepository: Repository<UserWarning>,
    private readonly eventEmitter: DomainEventEmitter,
    private readonly chatGateway: ChatGateway,
  ) {}

  async createForWarning(
    warningId: string,
    recipientId: string,
    adminId: string,
    initialMessage: string,
  ): Promise<{ thread: WarningThread; firstMessage: WarningMessage }> {
    const thread = this.threadRepository.create({
      warning: { id: warningId },
      recipient: { id: recipientId },
    });
    const savedThread = await this.threadRepository.save(thread);

    const firstMsg = this.messageRepository.create({
      thread: { id: savedThread.id },
      sender: { id: adminId },
      senderType: WarningSenderType.ADMIN,
      body: initialMessage,
    });
    const savedFirstMsg = await this.messageRepository.save(firstMsg);

    return { thread: savedThread, firstMessage: savedFirstMsg };
  }

  async sendUserMessage(
    threadId: string,
    userId: string,
    dto: SendWarningMessageDto,
  ): Promise<WarningMessageResponseDto> {
    const thread = await this.threadRepository.findOne({
      where: { id: threadId } as any,
      relations: { recipient: true },
    });
    if (!thread) throw new NotFoundException(`Warning thread "${threadId}" not found`);
    if (thread.recipient.id !== userId) throw new ForbiddenException('Access denied');
    if (thread.recipient.accountDeletedAt) throw new GoneException('This account has been deleted.');
    if (thread.isClosed) throw new BadRequestException('This conversation is closed');

    return this.persistAndBroadcast(threadId, userId, WarningSenderType.USER, userId, dto.body, dto.attachments);
  }

  async sendAdminMessage(
    threadId: string,
    adminId: string,
    dto: SendWarningMessageDto,
  ): Promise<WarningMessageResponseDto> {
    const thread = await this.threadRepository.findOne({
      where: { id: threadId } as any,
      relations: { recipient: true },
    });
    if (!thread) throw new NotFoundException(`Warning thread "${threadId}" not found`);
    // The warned user has deleted their account — they can no longer read replies, so block them.
    if (thread.recipient.accountDeletedAt) {
      throw new GoneException('This user has deleted their account. You can no longer reply to this thread.');
    }
    if (thread.isClosed) throw new BadRequestException('This conversation is closed');

    return this.persistAndBroadcast(threadId, adminId, WarningSenderType.ADMIN, thread.recipient.id, dto.body, dto.attachments);
  }

  async unreadCount(userId: string): Promise<number> {
    return this.messageRepository
      .createQueryBuilder('msg')
      .innerJoin('msg.thread', 't')
      .where('t.recipient_user_id = :userId', { userId })
      .andWhere('msg.sender_type = :adminType', { adminType: WarningSenderType.ADMIN })
      .andWhere('msg.read_at IS NULL')
      .getCount();
  }

  /**
   * Admin-team queue count: open threads whose latest message is from a user (awaiting an admin reply).
   * Closed threads are excluded — they can no longer be replied to. One number for the whole admin team.
   */
  async adminUnreadCount(): Promise<number> {
    return this.threadRepository
      .createQueryBuilder('t')
      .innerJoin(
        (qb) =>
          qb
            .select('msg.thread_id', 'thread_id')
            .addSelect('msg.sender_type', 'sender_type')
            .from(WarningMessage, 'msg')
            .where((sqb) => {
              const latest = sqb
                .subQuery()
                .select('m2.id')
                .from(WarningMessage, 'm2')
                .where('m2.thread_id = msg.thread_id')
                .orderBy('m2.created_at', 'DESC')
                .limit(1)
                .getQuery();
              return `msg.id = ${latest}`;
            }),
        'last_msg',
        'last_msg.thread_id = t.id',
      )
      .where('last_msg.sender_type = :userType', { userType: WarningSenderType.USER })
      .andWhere('t.is_closed = false')
      .getCount();
  }

  async markMessagesAsRead(threadId: string, userId: string): Promise<void> {
    const thread = await this.threadRepository.findOne({
      where: { id: threadId } as any,
      relations: { recipient: true },
    });
    if (!thread || thread.recipient.id !== userId) return;

    await this.messageRepository
      .createQueryBuilder()
      .update()
      .set({ readAt: new Date() })
      .where('thread_id = :threadId', { threadId })
      .andWhere('sender_type = :adminType', { adminType: WarningSenderType.ADMIN })
      .andWhere('read_at IS NULL')
      .execute();

    const count = await this.unreadCount(userId);
    this.chatGateway.broadcastWarningBadge(userId, count);
  }

  async findForUser(
    userId: string,
    query: WarningThreadQueryDto,
  ): Promise<PaginatedResponseDto<WarningThreadResponseDto>> {
    const qb = this.threadRepository
      .createQueryBuilder('t')
      .innerJoinAndSelect('t.recipient', 'recipient')
      .innerJoinAndSelect('recipient.profile', 'profile')
      .innerJoinAndSelect('t.warning', 'warning')
      .innerJoin('warning.report', 'report')
      .addSelect('report.reportRef')
      .leftJoin(
        (qb) =>
          qb
            .select('msg.thread_id', 'thread_id')
            .addSelect('msg.body', 'body')
            .addSelect('msg.created_at', 'created_at')
            .addSelect('msg.sender_type', 'sender_type')
            .from(WarningMessage, 'msg')
            .where((sqb) => {
              const sub = sqb
                .subQuery()
                .select('m2.id')
                .from(WarningMessage, 'm2')
                .where('m2.thread_id = msg.thread_id')
                .orderBy('m2.created_at', 'DESC')
                .limit(1)
                .getQuery();
              return `msg.id = ${sub}`;
            }),
        'last_msg',
        'last_msg.thread_id = t.id',
      )
      .addSelect('last_msg.body', 'lastMsgBody')
      .addSelect('last_msg.created_at', 'lastMsgCreatedAt')
      .addSelect('last_msg.sender_type', 'lastMsgSenderType')
      .where('t.recipient_user_id = :userId', { userId });

    if (query.isClosed !== undefined) {
      qb.andWhere('t.is_closed = :isClosed', { isClosed: query.isClosed });
    }

    if (query.search) {
      qb.andWhere('report.reportRef ILIKE :search', { search: `%${query.search}%` });
    }

    qb.orderBy('COALESCE(last_msg.created_at, t.created_at)', 'DESC')
      .limit(query.limit)
      .offset((query.page - 1) * query.limit);

    const { entities, raw } = await qb.getRawAndEntities();
    const total = await qb.getCount();

    const items = entities.map((thread, i) => {
      const firstName = thread.recipient.profile?.firstName ?? '';
      const lastName = thread.recipient.profile?.lastName ?? '';
      const recipientName = [firstName, lastName].filter(Boolean).join(' ') || thread.recipient.email;
      return {
        id: thread.id,
        reportRef: (thread.warning as any)?.report?.reportRef ?? '',
        suspensionDeadline: thread.warning.suspensionDeadline.toISOString(),
        isClosed: thread.isClosed,
        recipientName,
        recipientAvatarUrl: thread.recipient.profile?.avatarUrl ?? null,
        lastMessageBody: raw[i]?.lastMsgBody ?? null,
        lastMessageAt: raw[i]?.lastMsgCreatedAt ?? null,
        lastMessageSenderType: raw[i]?.lastMsgSenderType ?? null,
        createdAt: thread.createdAt.toISOString(),
      };
    });

    return new PaginatedResponseDto(items, total, query.page, query.limit);
  }

  async findMessages(
    threadId: string,
    query: WarningThreadQueryDto,
    requesterId?: string,
  ): Promise<PaginatedResponseDto<WarningMessageResponseDto>> {
    const thread = await this.threadRepository.findOne({
      where: { id: threadId } as any,
      relations: { recipient: true },
    });
    if (!thread) throw new NotFoundException(`Warning thread "${threadId}" not found`);
    if (requesterId && thread.recipient.id !== requesterId) {
      throw new ForbiddenException('Access denied');
    }

    const [messages, total] = await this.messageRepository.findAndCount({
      where: { thread: { id: threadId } } as any,
      relations: { sender: { profile: true } },
      order: { createdAt: query.order ?? 'ASC' },
      take: query.limit,
      skip: (query.page - 1) * query.limit,
    });

    return new PaginatedResponseDto(messages.map((m) => this.toMessageResponse(m)), total, query.page, query.limit);
  }

  async findAllMessages(threadId: string): Promise<WarningMessageResponseDto[]> {
    const messages = await this.messageRepository.find({
      where: { thread: { id: threadId } } as any,
      relations: { sender: { profile: true } },
      order: { createdAt: 'ASC' },
    });
    return messages.map((m) => this.toMessageResponse(m));
  }

  async findAllThreads(
    query: WarningThreadQueryDto,
  ): Promise<PaginatedResponseDto<WarningRepliesItemDto>> {
    const qb = this.threadRepository
      .createQueryBuilder('t')
      .innerJoinAndSelect('t.recipient', 'recipient')
      .innerJoinAndSelect('recipient.profile', 'profile')
      .innerJoinAndSelect('t.warning', 'warning')
      .innerJoin('warning.report', 'report')
      .addSelect('report.reportRef')
      .leftJoin(
        (qb) =>
          qb
            .select('msg.thread_id', 'thread_id')
            .addSelect('msg.body', 'body')
            .addSelect('msg.created_at', 'created_at')
            .addSelect('msg.sender_type', 'sender_type')
            .from(WarningMessage, 'msg')
            .where((sqb) => {
              const latestMessageSubQuery = sqb
                .subQuery()
                .select('msgLatest.id')
                .from(WarningMessage, 'msgLatest')
                .where('msgLatest.thread_id = msg.thread_id')
                .orderBy('msgLatest.created_at', 'DESC')
                .limit(1)
                .getQuery();
              return `msg.id = ${latestMessageSubQuery}`;
            }),
        'last_msg',
        'last_msg.thread_id = t.id',
      )
      .addSelect('last_msg.body', 'lastMsgBody')
      .addSelect('last_msg.created_at', 'lastMsgCreatedAt')
      .addSelect('last_msg.sender_type', 'lastMsgSenderType');

    if (query.isClosed !== undefined) {
      qb.andWhere('t.is_closed = :isClosed', { isClosed: query.isClosed });
    }

    if (query.search) {
      qb.andWhere(
        "(report.reportRef ILIKE :search OR recipient.email ILIKE :search OR CONCAT(profile.first_name, ' ', profile.last_name) ILIKE :search)",
        { search: `%${query.search}%` },
      );
    }

    qb.orderBy('COALESCE(last_msg.created_at, t.created_at)', 'DESC')
      .limit(query.limit)
      .offset((query.page - 1) * query.limit);

    const { entities, raw } = await qb.getRawAndEntities();
    const total = await qb.getCount();

    const items = entities.map((thread, i) => {
      const firstName = thread.recipient.profile?.firstName ?? '';
      const lastName = thread.recipient.profile?.lastName ?? '';
      const recipientName = [firstName, lastName].filter(Boolean).join(' ') || thread.recipient.email;
      return {
        threadId: thread.id,
        reportRef: raw[i]?.report_reportRef ?? '',
        recipientName,
        recipientAvatarUrl: thread.recipient.profile?.avatarUrl ?? null,
        lastUserMessageSnippet: (raw[i]?.lastMsgBody ?? '').substring(0, 100),
        lastUserMessageAt: raw[i]?.lastMsgCreatedAt ?? '',
        isClosed: thread.isClosed,
      };
    });

    return new PaginatedResponseDto(items, total, query.page, query.limit);
  }

  async findWithUserReplies(
    query: WarningThreadQueryDto,
  ): Promise<PaginatedResponseDto<WarningRepliesItemDto>> {
    const qb = this.threadRepository
      .createQueryBuilder('t')
      .innerJoinAndSelect('t.recipient', 'recipient')
      .innerJoinAndSelect('recipient.profile', 'profile')
      .innerJoinAndSelect('t.warning', 'warning')
      .innerJoin('warning.report', 'report')
      .addSelect('report.reportRef')
      .innerJoin(
        (qb) =>
          qb
            .select('msg.thread_id', 'thread_id')
            .addSelect('msg.body', 'body')
            .addSelect('msg.created_at', 'created_at')
            .addSelect('msg.sender_type', 'sender_type')
            .from(WarningMessage, 'msg')
            .where((sqb) => {
              const latestMessageSubQuery = sqb
                .subQuery()
                .select('msgLatest.id')
                .from(WarningMessage, 'msgLatest')
                .where('msgLatest.thread_id = msg.thread_id')
                .orderBy('msgLatest.created_at', 'DESC')
                .limit(1)
                .getQuery();
              return `msg.id = ${latestMessageSubQuery}`;
            }),
        'last_msg',
        'last_msg.thread_id = t.id',
      )
      .where('last_msg.sender_type = :senderType', { senderType: WarningSenderType.USER })
      .addSelect('last_msg.body', 'lastMsgBody')
      .addSelect('last_msg.created_at', 'lastMsgCreatedAt');

    if (query.search) {
      qb.andWhere(
        "(report.reportRef ILIKE :search OR recipient.email ILIKE :search OR CONCAT(profile.first_name, ' ', profile.last_name) ILIKE :search)",
        { search: `%${query.search}%` },
      );
    }

    qb.orderBy('last_msg.created_at', 'DESC')
      .limit(query.limit)
      .offset((query.page - 1) * query.limit);

    const { entities, raw } = await qb.getRawAndEntities();
    const total = await qb.getCount();

    const items = entities.map((thread, i) => {
      const firstName = thread.recipient.profile?.firstName ?? '';
      const lastName = thread.recipient.profile?.lastName ?? '';
      const recipientName = [firstName, lastName].filter(Boolean).join(' ') || thread.recipient.email;
      return {
        threadId: thread.id,
        reportRef: raw[i]?.report_reportRef ?? '',
        recipientName,
        recipientAvatarUrl: thread.recipient.profile?.avatarUrl ?? null,
        lastUserMessageSnippet: (raw[i]?.lastMsgBody ?? '').substring(0, 100),
        lastUserMessageAt: raw[i]?.lastMsgCreatedAt ?? '',
        isClosed: thread.isClosed,
      };
    });

    return new PaginatedResponseDto(items, total, query.page, query.limit);
  }

  async getThreadDetail(threadId: string, requesterId: string, isAdmin: boolean): Promise<{ name: string | null; email: string | null; avatarUrl: string | null; isClosed: boolean; isDeleted: boolean }> {
    const thread = await this.threadRepository.findOne({
      where: { id: threadId } as any,
      relations: { recipient: { profile: true } },
    });
    if (!thread) throw new NotFoundException(`Warning thread "${threadId}" not found`);
    if (!isAdmin && thread.recipient.id !== requesterId) {
      throw new ForbiddenException('Access denied');
    }

    if (isAdmin) {
      const name = await this.resolveDisplayName(thread.recipient);
      // Scrub the anonymized email/avatar of a deleted recipient so they aren't surfaced to admins.
      const deleted = !!thread.recipient.accountDeletedAt;
      return {
        name,
        email: deleted ? null : thread.recipient.email,
        avatarUrl: deleted ? null : (thread.recipient.profile?.avatarUrl ?? null),
        isClosed: thread.isClosed,
        isDeleted: deleted,
      };
    }

    return { name: 'Taskora Support', email: null, avatarUrl: null, isClosed: thread.isClosed, isDeleted: false };
  }

  async getThreadMeta(threadId: string): Promise<{
    recipientName: string;
    recipientRole: UserRole;
    reportRef: string;
    isClosed: boolean;
    createdAt: string;
  }> {
    const thread = await this.threadRepository.findOne({
      where: { id: threadId } as any,
      relations: { recipient: { profile: true }, warning: { report: true } },
    });
    if (!thread) throw new NotFoundException(`Warning thread "${threadId}" not found`);

    const firstName = thread.recipient.profile?.firstName ?? '';
    const lastName = thread.recipient.profile?.lastName ?? '';
    const recipientName = [firstName, lastName].filter(Boolean).join(' ') || thread.recipient.email;

    return {
      recipientName,
      recipientRole: thread.recipient.role,
      reportRef: (thread.warning as any)?.report?.reportRef ?? '',
      isClosed: thread.isClosed,
      createdAt: thread.createdAt.toISOString(),
    };
  }

  async closeThread(threadId: string): Promise<{ reportId: string }> {
    const thread = await this.threadRepository.findOne({
      where: { id: threadId } as any,
      relations: { warning: { report: true } },
    });
    if (!thread) throw new NotFoundException(`Warning thread "${threadId}" not found`);
    if (thread.isClosed) throw new BadRequestException('Thread is already closed');

    await this.threadRepository.update(threadId, { isClosed: true, closedAt: new Date() });
    return { reportId: (thread.warning as any).report.id };
  }

  async closeByReportId(reportId: string): Promise<void> {
    const warning = await this.warningRepository.findOne({
      where: { report: { id: reportId } } as any,
    });
    if (!warning) return;

    await this.threadRepository
      .createQueryBuilder()
      .update()
      .set({ isClosed: true, closedAt: new Date() })
      .where('warning_id = :warningId', { warningId: warning.id })
      .andWhere('is_closed = false')
      .execute();
  }

  private async resolveDisplayName(user: { id: string; role: UserRole; email: string; accountDeletedAt?: Date | null; profile?: { firstName?: string; lastName?: string } | null }): Promise<string | null> {
    // A deleted account is anonymized (business name purged, profile a tombstone) — show "Deleted User"
    // rather than falling through to a null business name for a deleted provider.
    if (user.accountDeletedAt) return 'Deleted User';
    if (user.role === UserRole.PROVIDER) {
      const row = await this.threadRepository.manager
        .createQueryBuilder()
        .select('wi.businessName', 'businessName')
        .from(ProviderWorkInfo, 'wi')
        .innerJoin(Profile, 'p', 'p.id = wi.profile_id')
        .where('p.user_id = :userId', { userId: user.id })
        .getRawOne<{ businessName: string | null }>();
      return row?.businessName ?? null;
    }
    const firstName = user.profile?.firstName ?? '';
    const lastName = user.profile?.lastName ?? '';
    return [firstName, lastName].filter(Boolean).join(' ') || user.email;
  }

  private async persistAndBroadcast(
    threadId: string,
    senderId: string,
    senderType: WarningSenderType,
    recipientId: string,
    body: string,
    attachments?: string[],
  ): Promise<WarningMessageResponseDto> {
    const msg = this.messageRepository.create({
      thread: { id: threadId },
      sender: { id: senderId },
      senderType,
      body,
      attachments: attachments ?? [],
      readAt: senderType === WarningSenderType.USER ? new Date() : null,
    });
    const saved = await this.messageRepository.save(msg);

    const withRelations = await this.messageRepository.findOne({
      where: { id: saved.id } as any,
      relations: { sender: { profile: true } },
    });

    const response = this.toMessageResponse(withRelations!);
    this.eventEmitter.emit(new WarningMessageCreatedEvent(threadId, response, recipientId, senderType));
    return response;
  }

  private toMessageResponse(m: WarningMessage): WarningMessageResponseDto {
    const firstName = m.sender.profile?.firstName ?? '';
    const lastName = m.sender.profile?.lastName ?? '';
    const senderName =
      m.senderType === WarningSenderType.ADMIN
        ? [firstName, lastName].filter(Boolean).join(' ') || 'Support Team'
        : [firstName, lastName].filter(Boolean).join(' ') || m.sender.email;
    return {
      id: m.id,
      senderType: m.senderType,
      senderName,
      senderAvatarUrl: m.sender.profile?.avatarUrl ?? null,
      body: m.body,
      attachments: (m.attachments as string[]) ?? null,
      createdAt: m.createdAt.toISOString(),
    };
  }
}
