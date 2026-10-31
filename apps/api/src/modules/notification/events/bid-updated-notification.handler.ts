import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { NotificationService } from '../notification.service';
import { NotificationType } from '../../../database/common/enum';
import { BidUpdatedEvent } from '../../bids/events/bid-updated.event';

@Injectable()
export class BidUpdatedNotificationHandler {
  private readonly logger = new Logger(BidUpdatedNotificationHandler.name);

  constructor(private readonly notificationService: NotificationService) {}

  @OnEvent(BidUpdatedEvent.EVENT_NAME)
  async handle(event: BidUpdatedEvent): Promise<void> {
    try {
      await this.notificationService.send({
        userId: event.seekerId,
        title: 'Bid revised',
        body: `A provider has updated their bid to $${event.price.toFixed(2)} ${event.currency}.`,
        type: NotificationType.BID_RECEIVED,
        data: { bidId: event.bidId, jobId: event.jobId },
      });
    } catch (err) {
      this.logger.error('Failed to send bid-updated notification', err);
    }
  }
}
