import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { NotificationService } from '../notification.service';
import { NotificationType, JobStatus } from '../../../database/common/enum';
import { BookingStatusChangedEvent } from '../../bookings/events/booking-status-changed.event';

const PROVIDER_INITIATED: Partial<Record<JobStatus, { title: string; body: string }>> = {
  [JobStatus.IN_PROGRESS]: {
    title: 'Booking accepted',
    body: 'The provider has accepted your booking. Work is now in progress.',
  },
  [JobStatus.COMPLETED]: {
    title: 'Booking completed',
    body: 'The provider has marked your booking as completed.',
  },
  [JobStatus.REJECTED]: {
    title: 'Booking rejected',
    body: 'The provider has declined your booking request.',
  },
};

@Injectable()
export class BookingStatusChangedNotificationHandler {
  private readonly logger = new Logger(BookingStatusChangedNotificationHandler.name);

  constructor(private readonly notificationService: NotificationService) {}

  @OnEvent(BookingStatusChangedEvent.EVENT_NAME)
  async handle(event: BookingStatusChangedEvent): Promise<void> {
    try {
      if (event.newStatus === JobStatus.CANCELLED) {
        // Seeker cancelled — notify provider
        await this.notificationService.send({
          userId: event.providerId,
          title: 'Booking cancelled',
          body: 'A seeker has cancelled their booking request.',
          type: NotificationType.BOOKING_STATUS_CHANGED,
          data: { bookingId: event.bookingId, status: event.newStatus },
        });
      } else {
        // Provider changed status — notify seeker
        const template = PROVIDER_INITIATED[event.newStatus];
        if (!template) return;
        await this.notificationService.send({
          userId: event.seekerId,
          title: template.title,
          body: template.body,
          type: NotificationType.BOOKING_STATUS_CHANGED,
          data: { bookingId: event.bookingId, status: event.newStatus },
        });
      }
    } catch (err) {
      this.logger.error('Failed to send booking-status-changed notification', err);
    }
  }
}
