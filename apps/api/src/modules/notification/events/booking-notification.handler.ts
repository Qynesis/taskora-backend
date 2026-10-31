import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationService } from '../notification.service';
import { NotificationType } from '../../../database/common/enum';
import { BookingCreatedEvent } from '../../bookings/events/booking-created.event';
import { Job } from '../../../database/entities/job.entity';

@Injectable()
export class BookingNotificationHandler {
  private readonly logger = new Logger(BookingNotificationHandler.name);

  constructor(
    private readonly notificationService: NotificationService,
    @InjectRepository(Job)
    private readonly jobRepository: Repository<Job>,
  ) {}

  @OnEvent(BookingCreatedEvent.EVENT_NAME)
  async handle(event: BookingCreatedEvent): Promise<void> {
    try {
      const job = await this.jobRepository.findOne({ where: { id: event.bookingId } as any });
      const title = job?.title ?? 'your job';

      await this.notificationService.send({
        userId: event.providerUserId,
        title: 'New booking',
        body: `You have a new direct booking request for "${title}".`,
        type: NotificationType.BOOKING_CONFIRMED,
        data: { bookingId: event.bookingId },
      });
    } catch (err) {
      this.logger.error('Failed to send booking-confirmed notification', err);
    }
  }
}
