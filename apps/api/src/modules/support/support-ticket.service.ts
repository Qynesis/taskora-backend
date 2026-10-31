import { BadRequestException, GoneException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SupportTicket } from '../../database/entities/support-ticket.entity';
import { SupportMessage } from '../../database/entities/support-message.entity';
import { ProviderWorkInfo } from '../../database/entities/provider_work_info.entity';
import { Profile } from '../../database/entities/profile.entity';
import { SupportSenderType, UserRole } from '../../database/common/enum';
import { DomainEventEmitter } from '../../events/domain-event-emitter.service';
import { SupportMessageCreatedEvent } from './events/support-message-created.event';
import { SupportTicketCreatedEvent } from './events/support-ticket-created.event';
import { CreateSupportTicketDto } from './dto/create-support-ticket.dto';
import { SendSupportMessageDto } from './dto/send-support-message.dto';
import { SupportTicketListItemDto } from './dto/support-ticket-list-item.dto';
import { SupportMessageResponseDto } from './dto/support-message-response.dto';
import { SupportTicketQueryDto } from './dto/support-ticket-query.dto';
import { PaginatedResponseDto } from '../../interfaces/paginated-response.dto';
import { ChatGateway } from '../messages/chat.gateway';

@Injectable()
export class SupportTicketService {
  constructor(
    @InjectRepository(SupportTicket)
    private readonly ticketRepository: Repository<SupportTicket>,
    @InjectRepository(SupportMessage)
    private readonly messageRepository: Repository<SupportMessage>,
    private readonly eventEmitter: DomainEventEmitter,
    private readonly chatGateway: ChatGateway,
  ) {}

  async create(userId: string, dto: CreateSupportTicketDto): Promise<SupportTicketListItemDto> {
    const ticket = this.ticketRepository.create({
      sender: { id: userId },
      subject: dto.subject,
    });
    const savedTicket = await this.ticketRepository.save(ticket);

    const firstMsg = this.messageRepository.create({
      ticket: { id: savedTicket.id },
      sender: { id: userId },
      senderType: SupportSenderType.USER,
      body: dto.body,
      attachments: dto.attachments ?? [],
      readAt: new Date(),
    });
    const savedFirstMsg = await this.messageRepository.save(firstMsg);

    this.eventEmitter.emit(
      new SupportTicketCreatedEvent(savedTicket.id, userId, dto.subject),
    );

    // A new ticket joins the admin's awaiting-reply queue — push the fresh count to all admins.
    this.chatGateway.broadcastAdminSupportBadge(await this.adminUnreadCount());

    return this.toListItem(savedTicket, savedFirstMsg);
  }

  async findForUser(
    userId: string,
    query: SupportTicketQueryDto,
  ): Promise<PaginatedResponseDto<SupportTicketListItemDto>> {
    const qb = this.ticketRepository
      .createQueryBuilder('t')
      .innerJoinAndSelect('t.sender', 'sender')
      .innerJoinAndSelect('sender.profile', 'profile')
      .where('t.sender_user_id = :userId', { userId });

    if (query.search) {
      qb.andWhere('t.subject ILIKE :search', { search: `%${query.search}%` });
    }

    qb.leftJoin(
        (qb) =>
          qb
            .select('msg.ticket_id', 'ticket_id')
            .addSelect('msg.body', 'body')
            .addSelect('msg.created_at', 'created_at')
            .addSelect('msg.sender_type', 'sender_type')
            .from(SupportMessage, 'msg')
            .where((sqb) => {
              const latestMessageSubQuery = sqb
                .subQuery()
                .select('msgLatest.id')
                .from(SupportMessage, 'msgLatest')
                .where('msgLatest.ticket_id = msg.ticket_id')
                .orderBy('msgLatest.created_at', 'DESC')
                .limit(1)
                .getQuery();
              return `msg.id = ${latestMessageSubQuery}`;
            }),
        'last_msg',
        'last_msg.ticket_id = t.id',
      )
      .addSelect('last_msg.body', 'lastMsgBody')
      .addSelect('last_msg.created_at', 'lastMsgCreatedAt')
      .addSelect('last_msg.sender_type', 'lastMsgSenderType')
      .orderBy('COALESCE(last_msg.created_at, t.created_at)', 'DESC')
      .limit(query.limit)
      .offset((query.page - 1) * query.limit);

    const { entities, raw } = await qb.getRawAndEntities();
    const total = await qb.getCount();

    const items = entities.map((ticket, i) => {
      const firstName = ticket.sender.profile?.firstName ?? '';
      const lastName = ticket.sender.profile?.lastName ?? '';
      const senderName = [firstName, lastName].filter(Boolean).join(' ') || ticket.sender.email;
      return {
        id: ticket.id,
        subject: ticket.subject,
        senderName,
        senderAvatarUrl: ticket.sender.profile?.avatarUrl ?? null,
        lastMessageBody: raw[i]?.lastMsgBody ?? null,
        lastMessageAt: raw[i]?.lastMsgCreatedAt ?? null,
        lastMessageSenderType: raw[i]?.lastMsgSenderType ?? null,
        createdAt: ticket.createdAt.toISOString(),
      };
    });

    return new PaginatedResponseDto(items, total, query.page, query.limit);
  }

  async unreadCount(userId: string): Promise<number> {
    return this.messageRepository
      .createQueryBuilder('msg')
      .innerJoin('msg.ticket', 't')
      .where('t.sender_user_id = :userId', { userId })
      .andWhere('msg.sender_type = :adminType', { adminType: SupportSenderType.ADMIN })
      .andWhere('msg.read_at IS NULL')
      .getCount();
  }

  /**
   * Admin-team queue count: tickets whose latest message is from a user (i.e. awaiting an admin reply).
   * Shared across all admins — there is no per-ticket assignment, so one number serves the whole team.
   */
  async adminUnreadCount(): Promise<number> {
    return this.ticketRepository
      .createQueryBuilder('t')
      .innerJoin(
        (qb) =>
          qb
            .select('msg.ticket_id', 'ticket_id')
            .addSelect('msg.sender_type', 'sender_type')
            .from(SupportMessage, 'msg')
            .where((sqb) => {
              const latest = sqb
                .subQuery()
                .select('m2.id')
                .from(SupportMessage, 'm2')
                .where('m2.ticket_id = msg.ticket_id')
                .orderBy('m2.created_at', 'DESC')
                .limit(1)
                .getQuery();
              return `msg.id = ${latest}`;
            }),
        'last_msg',
        'last_msg.ticket_id = t.id',
      )
      .where('last_msg.sender_type = :userType', { userType: SupportSenderType.USER })
      .getCount();
  }

  async markMessagesAsRead(ticketId: string, userId: string): Promise<void> {
    const ticket = await this.ticketRepository.findOne({
      where: { id: ticketId } as any,
      relations: { sender: true },
    });
    if (!ticket || ticket.sender.id !== userId) return;

    await this.messageRepository
      .createQueryBuilder()
      .update()
      .set({ readAt: new Date() })
      .where('ticket_id = :ticketId', { ticketId })
      .andWhere('sender_type = :adminType', { adminType: SupportSenderType.ADMIN })
      .andWhere('read_at IS NULL')
      .execute();

    const count = await this.unreadCount(userId);
    this.chatGateway.broadcastSupportBadge(userId, count);
  }

  async findAllTickets(
    query: SupportTicketQueryDto,
  ): Promise<PaginatedResponseDto<SupportTicketListItemDto>> {
    const qb = this.ticketRepository
      .createQueryBuilder('t')
      .innerJoinAndSelect('t.sender', 'sender')
      .innerJoinAndSelect('sender.profile', 'profile')
      .leftJoin(
        (qb) =>
          qb
            .select('msg.ticket_id', 'ticket_id')
            .addSelect('msg.body', 'body')
            .addSelect('msg.created_at', 'created_at')
            .addSelect('msg.sender_type', 'sender_type')
            .from(SupportMessage, 'msg')
            .where((sqb) => {
              const latestMessageSubQuery = sqb
                .subQuery()
                .select('msgLatest.id')
                .from(SupportMessage, 'msgLatest')
                .where('msgLatest.ticket_id = msg.ticket_id')
                .orderBy('msgLatest.created_at', 'DESC')
                .limit(1)
                .getQuery();
              return `msg.id = ${latestMessageSubQuery}`;
            }),
        'last_msg',
        'last_msg.ticket_id = t.id',
      )
      .addSelect('last_msg.body', 'lastMsgBody')
      .addSelect('last_msg.created_at', 'lastMsgCreatedAt')
      .addSelect('last_msg.sender_type', 'lastMsgSenderType');

    if (query.search) {
      qb.andWhere(
        "(t.subject ILIKE :search OR sender.email ILIKE :search OR CONCAT(profile.first_name, ' ', profile.last_name) ILIKE :search)",
        { search: `%${query.search}%` },
      );
    }

    qb.orderBy('COALESCE(last_msg.created_at, t.created_at)', 'DESC')
      .limit(query.limit)
      .offset((query.page - 1) * query.limit);

    const { entities, raw } = await qb.getRawAndEntities();
    const total = await qb.getCount();

    const items = entities.map((ticket, i) => {
      const firstName = ticket.sender.profile?.firstName ?? '';
      const lastName = ticket.sender.profile?.lastName ?? '';
      const senderName = [firstName, lastName].filter(Boolean).join(' ') || ticket.sender.email;
      return {
        id: ticket.id,
        subject: ticket.subject,
        senderName,
        senderAvatarUrl: ticket.sender.profile?.avatarUrl ?? null,
        lastMessageBody: raw[i]?.lastMsgBody ?? null,
        lastMessageAt: raw[i]?.lastMsgCreatedAt ?? null,
        lastMessageSenderType: raw[i]?.lastMsgSenderType ?? null,
        createdAt: ticket.createdAt.toISOString(),
      };
    });

    return new PaginatedResponseDto(items, total, query.page, query.limit);
  }

  async findMessages(
    ticketId: string,
    query: SupportTicketQueryDto,
    requesterId?: string,
  ): Promise<PaginatedResponseDto<SupportMessageResponseDto>> {
    const ticket = await this.ticketRepository.findOne({
      where: { id: ticketId } as any,
      relations: { sender: true },
    });
    if (!ticket) throw new NotFoundException(`Support ticket "${ticketId}" not found`);
    if (requesterId && ticket.sender.id !== requesterId) {
      throw new BadRequestException('Access denied');
    }

    const [messages, total] = await this.messageRepository.findAndCount({
      where: { ticket: { id: ticketId } } as any,
      relations: { sender: { profile: true } },
      order: { createdAt: query.order ?? 'ASC' },
      take: query.limit,
      skip: (query.page - 1) * query.limit,
    });

    return new PaginatedResponseDto(messages.map((m) => this.toMessageResponse(m)), total, query.page, query.limit);
  }

  async findAllMessages(ticketId: string): Promise<SupportMessageResponseDto[]> {
    const messages = await this.messageRepository.find({
      where: { ticket: { id: ticketId } } as any,
      relations: { sender: { profile: true } },
      order: { createdAt: 'ASC' },
    });
    return messages.map((m) => this.toMessageResponse(m));
  }

  async sendUserMessage(
    ticketId: string,
    userId: string,
    dto: SendSupportMessageDto,
  ): Promise<SupportMessageResponseDto> {
    const ticket = await this.ticketRepository.findOne({
      where: { id: ticketId } as any,
      relations: { sender: true },
    });
    if (!ticket) throw new NotFoundException(`Support ticket "${ticketId}" not found`);
    if (ticket.sender.id !== userId) throw new BadRequestException('Access denied');
    if (ticket.sender.accountDeletedAt) throw new GoneException('This account has been deleted.');

    return this.persistAndBroadcast(ticketId, userId, SupportSenderType.USER, dto.body, dto.attachments, userId);
  }

  async sendAdminMessage(
    ticketId: string,
    adminId: string,
    dto: SendSupportMessageDto,
  ): Promise<SupportMessageResponseDto> {
    const ticket = await this.ticketRepository.findOne({
      where: { id: ticketId } as any,
      relations: { sender: true },
    });
    if (!ticket) throw new NotFoundException(`Support ticket "${ticketId}" not found`);
    // The ticket owner has deleted their account — they can no longer read replies, so block them.
    if (ticket.sender.accountDeletedAt) {
      throw new GoneException('This user has deleted their account. You can no longer reply to this ticket.');
    }

    return this.persistAndBroadcast(ticketId, adminId, SupportSenderType.ADMIN, dto.body, dto.attachments, ticket.sender.id);
  }

  async getTicketDetail(ticketId: string, requesterId: string, isAdmin: boolean): Promise<{ name: string | null; email: string | null; avatarUrl: string | null; isDeleted: boolean }> {
    const ticket = await this.ticketRepository.findOne({
      where: { id: ticketId } as any,
      relations: { sender: { profile: true } },
    });
    if (!ticket) throw new NotFoundException(`Support ticket "${ticketId}" not found`);
    if (!isAdmin && ticket.sender.id !== requesterId) {
      throw new BadRequestException('Access denied');
    }

    if (isAdmin) {
      const name = await this.resolveDisplayName(ticket.sender);
      // Scrub the anonymized email/avatar of a deleted sender so they aren't surfaced to admins.
      const deleted = !!ticket.sender.accountDeletedAt;
      return {
        name,
        email: deleted ? null : ticket.sender.email,
        avatarUrl: deleted ? null : (ticket.sender.profile?.avatarUrl ?? null),
        isDeleted: deleted,
      };
    }

    // User viewing their own ticket — the counterparty is the platform, never deleted.
    return { name: 'Taskora Support', email: null, avatarUrl: null, isDeleted: false };
  }

  async getTicketMeta(ticketId: string): Promise<{
    subject: string;
    senderName: string;
    createdAt: string;
  }> {
    const ticket = await this.ticketRepository.findOne({
      where: { id: ticketId } as any,
      relations: { sender: { profile: true } },
    });
    if (!ticket) throw new NotFoundException(`Support ticket "${ticketId}" not found`);

    const firstName = ticket.sender.profile?.firstName ?? '';
    const lastName = ticket.sender.profile?.lastName ?? '';
    const senderName = [firstName, lastName].filter(Boolean).join(' ') || ticket.sender.email;

    return {
      subject: ticket.subject,
      senderName,
      createdAt: ticket.createdAt.toISOString(),
    };
  }

  private async resolveDisplayName(user: { id: string; role: UserRole; email: string; accountDeletedAt?: Date | null; profile?: { firstName?: string; lastName?: string } | null }): Promise<string | null> {
    // A deleted account is anonymized: its business name is purged and its profile is a tombstone,
    // so short-circuit to "Deleted User" (otherwise a deleted provider would resolve to null).
    if (user.accountDeletedAt) return 'Deleted User';
    if (user.role === UserRole.PROVIDER) {
      const row = await this.ticketRepository.manager
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
    ticketId: string,
    senderId: string,
    senderType: SupportSenderType,
    body: string,
    attachments?: string[],
    ticketOwnerId: string = '',
  ): Promise<SupportMessageResponseDto> {
    const msg = this.messageRepository.create({
      ticket: { id: ticketId },
      sender: { id: senderId },
      senderType,
      body,
      attachments: attachments ?? [],
      readAt: senderType === SupportSenderType.USER ? new Date() : null,
    });
    const saved = await this.messageRepository.save(msg);

    const withRelations = await this.messageRepository.findOne({
      where: { id: saved.id } as any,
      relations: { sender: { profile: true } },
    });

    const response = this.toMessageResponse(withRelations!);
    this.eventEmitter.emit(new SupportMessageCreatedEvent(ticketId, response, senderType, ticketOwnerId));
    return response;
  }

  private toListItem(ticket: SupportTicket, lastMsg?: SupportMessage): SupportTicketListItemDto {
    const firstName = ticket.sender?.profile?.firstName ?? '';
    const lastName = ticket.sender?.profile?.lastName ?? '';
    const senderName = [firstName, lastName].filter(Boolean).join(' ') || (ticket.sender?.email ?? '');
    return {
      id: ticket.id,
      subject: ticket.subject,
      senderName,
      senderAvatarUrl: ticket.sender?.profile?.avatarUrl ?? null,
      lastMessageBody: lastMsg?.body ?? null,
      lastMessageAt: lastMsg?.createdAt?.toISOString() ?? null,
      lastMessageSenderType: lastMsg?.senderType ?? null,
      createdAt: ticket.createdAt.toISOString(),
    };
  }

  private toMessageResponse(m: SupportMessage): SupportMessageResponseDto {
    const firstName = m.sender.profile?.firstName ?? '';
    const lastName = m.sender.profile?.lastName ?? '';
    const senderName =
      m.senderType === SupportSenderType.ADMIN
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
