import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { JobStatusChangedEvent } from '../../jobs/events/job-status-changed.event';
import { NotificationService } from '../notification.service';
import { NotificationType, JobStatus } from '../../../database/common/enum';

const STATUS_MESSAGES: Partial<Record<JobStatus, { title: string; body: (title: string) => string; type: NotificationType }>> = {
  [JobStatus.IN_PROGRESS]: {
    title: 'Job started',
    body: (t) => `"${t}" is now in progress.`,
    type: NotificationType.JOB_STARTED,
  },
  [JobStatus.COMPLETED]: {
    title: 'Job completed',
    body: (t) => `"${t}" has been marked as completed.`,
    type: NotificationType.JOB_COMPLETED,
  },
  [JobStatus.CANCELLED]: {
    title: 'Job cancelled',
    body: (t) => `"${t}" has been cancelled.`,
    type: NotificationType.JOB_CANCELLED,
  },
};

@Injectable()
export class JobStatusChangedNotificationHandler {
  private readonly logger = new Logger(JobStatusChangedNotificationHandler.name);

  constructor(private readonly notificationService: NotificationService) {}

  @OnEvent(JobStatusChangedEvent.EVENT_NAME)
  async handle(event: JobStatusChangedEvent): Promise<void> {
    const template = STATUS_MESSAGES[event.newStatus];
    if (!template) return;

    const data = { jobId: event.jobId };
    const sends: Promise<void>[] = [];

    // Notify seeker — unless they initiated the change
    if (event.initiatedBy !== 'seeker') {
      sends.push(
        this.notificationService.send({
          userId: event.seekerId,
          title: template.title,
          body: template.body(event.jobTitle),
          type: template.type,
          data,
        }),
      );
    }

    // Notify provider — unless they initiated the change
    if (event.providerId && event.initiatedBy !== 'provider') {
      sends.push(
        this.notificationService.send({
          userId: event.providerId,
          title: template.title,
          body: template.body(event.jobTitle),
          type: template.type,
          data,
        }),
      );
    }

    try {
      await Promise.all(sends);
    } catch (err) {
      this.logger.error('Failed to send job-status-changed notification', err);
    }
  }
}
