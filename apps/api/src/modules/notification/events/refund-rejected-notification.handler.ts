import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { NotificationService } from '../notification.service';
import { NotificationType } from '../../../database/common/enum';
import { RefundRejectedEvent } from '../../jobs/events/refund-rejected.event';

@Injectable()
export class RefundRejectedNotificationHandler {
  private readonly logger = new Logger(RefundRejectedNotificationHandler.name);

  constructor(private readonly notificationService: NotificationService) {}

  @OnEvent(RefundRejectedEvent.EVENT_NAME)
  async handle(event: RefundRejectedEvent): Promise<void> {
    try {
      await this.notificationService.send({
        userId: event.seekerId,
        title: 'Refund request rejected',
        body: `Your refund request for "${event.jobTitle || 'your job'}" has been rejected by the provider.`,
        type: NotificationType.REFUND_REJECTED,
        data: { refundRequestId: event.refundRequestId, jobId: event.jobId },
      });
    } catch (err) {
      this.logger.error('Failed to send refund-rejected notification', err);
    }
  }
}
