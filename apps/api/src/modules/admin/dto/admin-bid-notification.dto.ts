import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { NotificationType } from '../../../database/common/enum';
import { Notification } from '../../../database/entities/notification.entity';

const TITLES: Partial<Record<NotificationType, string>> = {
  [NotificationType.BID_RECEIVED]: 'New Bid Received',
  [NotificationType.BID_ACCEPTED]: 'Bid Accepted',
  [NotificationType.BID_DECLINED]: 'Bid Declined',
};

export class AdminBidNotificationDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ enum: [NotificationType.BID_RECEIVED, NotificationType.BID_ACCEPTED, NotificationType.BID_DECLINED] })
  type!: NotificationType;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  body!: string;

  @ApiPropertyOptional({ nullable: true })
  jobId!: string | null;

  @ApiPropertyOptional({ nullable: true })
  bidId!: string | null;

  @ApiProperty()
  createdAt!: string;

  static from(n: Notification): AdminBidNotificationDto {
    const d = (n.data ?? {}) as Record<string, any>;
    const providerName = d.providerName ?? 'A provider';
    const seekerName = d.seekerName ?? 'a seeker';
    const jobTitle = d.jobTitle ?? 'a job';

    const body =
      n.type === NotificationType.BID_RECEIVED
        ? `${providerName} placed a bid on ${seekerName}'s service "${jobTitle}"`
        : n.type === NotificationType.BID_ACCEPTED
          ? `${seekerName} accepted ${providerName}'s bid on "${jobTitle}"`
          : `${seekerName} declined ${providerName}'s bid on "${jobTitle}"`;

    return {
      id: n.id,
      type: n.type,
      title: TITLES[n.type] ?? n.type,
      body,
      jobId: d.jobId ?? null,
      bidId: d.bidId ?? null,
      createdAt: n.createdAt.toISOString(),
    };
  }
}
