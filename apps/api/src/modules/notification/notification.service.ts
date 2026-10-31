import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import * as admin from 'firebase-admin';
import { Notification } from '../../database/entities/notification.entity';
import { FcmToken } from '../../database/entities/fcm-token.entity';
import { UserNotificationSettings } from '../../database/entities/user_notification_settings.entity';
import { User } from '../../database/entities/user.entity';
import { NotificationType, UserRole } from '../../database/common/enum';
import { RegisterFcmTokenDto } from './dto/register-fcm-token.dto';
import { NotificationQueryDto } from './dto/notification-query.dto';
import { NotificationResponseDto } from './dto/notification-response.dto';
import { AdminBidNotificationDto } from '../admin/dto/admin-bid-notification.dto';
import { PaginatedResponseDto } from '../../interfaces/paginated-response.dto';
import { ChatGateway } from '../messages/chat.gateway';
import { AppCacheService } from '../../cache/cache.service';

export interface SendPayload {
  userId: string;
  title: string;
  body: string;
  type: NotificationType;
  data?: Record<string, string>;
}

@Injectable()
export class NotificationService implements OnModuleInit {
  private readonly logger = new Logger(NotificationService.name);
  private firebaseApp: admin.app.App | null = null;

  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    @InjectRepository(FcmToken)
    private readonly fcmTokenRepository: Repository<FcmToken>,
    @InjectRepository(UserNotificationSettings)
    private readonly notificationSettingsRepository: Repository<UserNotificationSettings>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly configService: ConfigService,
    private readonly chatGateway: ChatGateway,
    private readonly cacheService: AppCacheService,
  ) {}

  onModuleInit(): void {
    const projectId = this.configService.get<string>('fcm.projectId');
    const clientEmail = this.configService.get<string>('fcm.clientEmail');
    const privateKey = this.configService.get<string>('fcm.privateKey');

    if (!projectId || !clientEmail || !privateKey) {
      this.logger.warn('FCM credentials not configured — push notifications disabled');
      return;
    }

    this.firebaseApp = admin.initializeApp(
      { credential: admin.credential.cert({ projectId, clientEmail, privateKey }) },
      'notification',
    );
    this.logger.log('Firebase Admin initialized');
  }

  async registerToken(userId: string, dto: RegisterFcmTokenDto): Promise<FcmToken> {
    const existing = await this.fcmTokenRepository.findOne({
      where: { token: dto.token } as any,
      relations: { user: true },
    });

    if (existing) {
      if ((existing.user as any).id !== userId) {
        (existing as any).user = { id: userId };
        existing.platform = dto.platform ?? null;
        return this.fcmTokenRepository.save(existing);
      }
      return existing;
    }

    const created = this.fcmTokenRepository.create({
      user: { id: userId },
      token: dto.token,
      platform: dto.platform ?? null,
    } as any) as unknown as FcmToken;
    return this.fcmTokenRepository.save(created);
  }

  async removeToken(userId: string, token: string): Promise<void> {
    await this.fcmTokenRepository
      .createQueryBuilder()
      .delete()
      .where('token = :token AND user_id = :userId', { token, userId })
      .execute();
  }

  async send(payload: SendPayload): Promise<void> {
    const record = (await this.notificationRepository.save(
      this.notificationRepository.create({
        user: { id: payload.userId },
        title: payload.title,
        body: payload.body,
        type: payload.type,
        data: payload.data ?? null,
        readAt: null,
        sentAt: null,
      } as any),
    )) as unknown as Notification;

    // Clear this user's cached notification list so the new one shows immediately. The list is
   // this, the unread badge updates but the list stays stale until the TTL expires.
    await this.cacheService.delByPrefix(`notifications:list:${payload.userId}:`);

    const unreadCount = await this.unreadCount(payload.userId);
    this.chatGateway.broadcastNotificationBadge(payload.userId, unreadCount);

    if (!this.firebaseApp) return;

    const settings = await this.notificationSettingsRepository.findOne({
      where: { user: { id: payload.userId } } as any,
    });
    const pushSuppressed =
      payload.type === NotificationType.NEW_MESSAGE
        ? settings?.messageAlertsEnabled === false
        : settings?.pushEnabled === false;
    if (pushSuppressed) return;

    const tokens = await this.fcmTokenRepository.find({
      where: { user: { id: payload.userId } } as any,
    });

    if (tokens.length === 0) return;

    const fcmTokens = tokens.map((t) => t.token);
    const stringData = payload.data
      ? Object.fromEntries(Object.entries(payload.data).map(([k, v]) => [k, String(v)]))
      : {};

    try {
      const response = await this.firebaseApp.messaging().sendEachForMulticast({
        tokens: fcmTokens,
        notification: { title: payload.title, body: payload.body },
        data: { type: payload.type, ...stringData },
      });

      const toRemove: string[] = [];
      response.responses.forEach((r, i) => {
        const code = r.error?.code ?? '';
        if (!r.success && (code === 'messaging/registration-token-not-registered' || code === 'messaging/invalid-registration-token')) {
          toRemove.push(fcmTokens[i]!);
        }
      });

      if (toRemove.length) {
        await this.fcmTokenRepository
          .createQueryBuilder()
          .delete()
          .where('token IN (:...tokens)', { tokens: toRemove })
          .execute();
      }

      await this.notificationRepository.update(record.id, { sentAt: new Date() } as any);
    } catch (err) {
      this.logger.error('FCM send failed', err);
    }
  }

  // Provider-submission notifications have no single recipient; fan out one row per admin
  // so each admin's own /notifications feed surfaces it.
  async sendToAdmins(payload: Omit<SendPayload, 'userId'>): Promise<void> {
    const admins = await this.userRepository.find({
      where: { role: UserRole.ADMIN } as any,
      select: { id: true } as any,
    });
    await Promise.all(admins.map((admin) => this.send({ ...payload, userId: admin.id })));
  }

  async unreadCount(userId: string): Promise<number> {
    return this.notificationRepository.count({
      where: { user: { id: userId }, readAt: IsNull() } as any,
    });
  }

  async findForUser(userId: string, query: NotificationQueryDto): Promise<PaginatedResponseDto<NotificationResponseDto>> {
    const [data, total] = await this.notificationRepository.findAndCount({
      where: { user: { id: userId } } as any,
      order: { createdAt: 'DESC' },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    });
    return new PaginatedResponseDto(data.map(NotificationResponseDto.from), total, query.page, query.limit);
  }

  async findBidNotificationsForAdmin(query: NotificationQueryDto): Promise<PaginatedResponseDto<AdminBidNotificationDto>> {
    const BID_TYPES = [NotificationType.BID_RECEIVED, NotificationType.BID_ACCEPTED, NotificationType.BID_DECLINED];

    const [data, total] = await this.notificationRepository.findAndCount({
      where: BID_TYPES.map((type) => ({ type })) as any,
      order: { createdAt: 'DESC' },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    });

    return new PaginatedResponseDto(data.map(AdminBidNotificationDto.from), total, query.page, query.limit);
  }

  async markRead(id: string, userId: string): Promise<void> {
    await this.notificationRepository.update(
      { id, user: { id: userId } } as any,
      { readAt: new Date() } as any,
    );
  }

  async markAllRead(userId: string): Promise<void> {
    await this.notificationRepository
      .createQueryBuilder()
      .update()
      .set({ readAt: new Date() } as any)
      .where('user_id = :userId AND read_at IS NULL', { userId })
      .execute();
  }
}
