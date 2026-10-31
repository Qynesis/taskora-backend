import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { NotificationType } from '../../../database/common/enum';
import { JobRefundRequestedEvent } from '../../jobs/events/job-refund-requested.event';
import { NotificationService } from '../notification.service';

@Injectable()
export class JobRefundRequestedNotificationHandler {
  private readonly logger = new Logger(JobRefundRequestedNotificationHandler.name);

  constructor(private readonly notificationService: NotificationService) {}

  @OnEvent(JobRefundRequestedEvent.EVENT_NAME)
  async handle(event: JobRefundRequestedEvent): Promise<void> {
    try {
      const jobTitle = event.jobTitle || 'your job';
      await this.notificationService.send({
        userId: event.providerId,
        title: 'Refund request submitted',
        body: `A seeker has submitted a refund request for "${jobTitle}".`,
        type: NotificationType.REFUND_REQUESTED,
        data: {
          jobId: event.jobId,
          refundRequestId: event.refundRequestId,
          reason: event.reason,
          seekerId: event.seekerId,
        },
      });
    } catch (err) {
      this.logger.error('Failed to send refund-request notification', err);
    }
  }
}
