import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BidCreatedEvent } from '../../bids/events/bid-created.event';
import { NotificationService } from '../notification.service';
import { NotificationType } from '../../../database/common/enum';
import { Job } from '../../../database/entities/job.entity';
import { Bid } from '../../../database/entities/bid.entity';

@Injectable()
export class BidCreatedNotificationHandler {
  private readonly logger = new Logger(BidCreatedNotificationHandler.name);

  constructor(
    private readonly notificationService: NotificationService,
    @InjectRepository(Job)
    private readonly jobRepository: Repository<Job>,
    @InjectRepository(Bid)
    private readonly bidRepository: Repository<Bid>,
  ) {}

  @OnEvent(BidCreatedEvent.EVENT_NAME)
  async handle(event: BidCreatedEvent): Promise<void> {
    try {
      const [job, bid] = await Promise.all([
        this.jobRepository.findOne({
          where: { id: event.jobId } as any,
          relations: { seeker: { profile: true } },
        }),
        this.bidRepository.findOne({
          where: { id: event.bidId } as any,
          relations: { provider: { profile: true } },
        }),
      ]);
      if (!job || !bid) return;

      const providerProfile = bid.provider.profile;
      const seekerProfile = job.seeker.profile;
      const providerName = providerProfile
        ? `${providerProfile.firstName ?? ''} ${providerProfile.lastName ?? ''}`.trim() || bid.provider.email
        : bid.provider.email;
      const seekerName = seekerProfile
        ? `${seekerProfile.firstName ?? ''} ${seekerProfile.lastName ?? ''}`.trim() || job.seeker.email
        : job.seeker.email;
      const jobTitle = job.title ?? 'Untitled job';

      await this.notificationService.send({
        userId: job.seeker.id,
        title: 'New bid received',
        body: `${providerName} placed a bid on your service "${jobTitle}"`,
        type: NotificationType.BID_RECEIVED,
        data: {
          jobId: event.jobId,
          bidId: event.bidId,
          providerName,
          providerId: bid.provider.id,
          seekerName,
          seekerId: job.seeker.id,
          jobTitle,
        },
      });
    } catch (err) {
      this.logger.error('Failed to send bid-created notification', err);
    }
  }
}
