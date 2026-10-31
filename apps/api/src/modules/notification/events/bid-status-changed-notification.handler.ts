import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BidStatusChangedEvent } from '../../bids/events/bid-status-changed.event';
import { NotificationService } from '../notification.service';
import { NotificationType, BidStatus } from '../../../database/common/enum';
import { Bid } from '../../../database/entities/bid.entity';

@Injectable()
export class BidStatusChangedNotificationHandler {
  private readonly logger = new Logger(BidStatusChangedNotificationHandler.name);

  constructor(
    private readonly notificationService: NotificationService,
    @InjectRepository(Bid)
    private readonly bidRepository: Repository<Bid>,
  ) {}

  @OnEvent(BidStatusChangedEvent.EVENT_NAME)
  async handle(event: BidStatusChangedEvent): Promise<void> {
    try {
      if (event.newStatus !== BidStatus.ACCEPTED && event.newStatus !== BidStatus.DECLINED) return;

      const bid = await this.bidRepository.findOne({
        where: { id: event.bidId } as any,
        relations: { provider: { profile: true }, job: { seeker: { profile: true } } },
      });
      if (!bid) return;

      const providerProfile = bid.provider.profile;
      const seekerProfile = (bid.job as any).seeker?.profile;
      const providerName = providerProfile
        ? `${providerProfile.firstName ?? ''} ${providerProfile.lastName ?? ''}`.trim() || bid.provider.email
        : bid.provider.email;
      const seeker = (bid.job as any).seeker;
      const seekerName = seekerProfile
        ? `${seekerProfile.firstName ?? ''} ${seekerProfile.lastName ?? ''}`.trim() || seeker?.email
        : seeker?.email ?? null;

      const isAccepted = event.newStatus === BidStatus.ACCEPTED;

      await this.notificationService.send({
        userId: event.providerId,
        title: isAccepted ? 'Bid accepted' : 'Bid declined',
        body: isAccepted
          ? `Your bid on "${event.jobTitle}" has been accepted!`
          : `Your bid on "${event.jobTitle}" has been declined.`,
        type: isAccepted ? NotificationType.BID_ACCEPTED : NotificationType.BID_DECLINED,
        data: {
          jobId: event.jobId,
          bidId: event.bidId,
          providerName,
          providerId: bid.provider.id,
          seekerName,
          seekerId: seeker?.id ?? null,
          jobTitle: event.jobTitle,
        },
      });
    } catch (err) {
      this.logger.error('Failed to send bid-status-changed notification', err);
    }
  }
}
