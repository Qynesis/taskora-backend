import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { ReportWarningSentEvent } from '../../reports/events/report-warning-sent.event';
import { NotificationService } from '../notification.service';
import { NotificationType } from '../../../database/common/enum';

@Injectable()
export class ReportWarningNotificationHandler {
  private readonly logger = new Logger(ReportWarningNotificationHandler.name);

  constructor(private readonly notificationService: NotificationService) {}

  @OnEvent(ReportWarningSentEvent.EVENT_NAME)
  async handle(event: ReportWarningSentEvent): Promise<void> {
    try {
      await this.notificationService.send({
        userId: event.recipientUserId,
        title: 'Warning received',
        body: 'You have received a warning. Please review it and take action.',
        type: NotificationType.WARNING_RECEIVED,
        data: { warningId: event.warningId, threadId: event.threadId },
      });
    } catch (err) {
      this.logger.error('Failed to send report-warning notification', err);
    }
  }
}
