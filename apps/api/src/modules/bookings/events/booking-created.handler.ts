import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { BookingCreatedEvent } from './booking-created.event';

@Injectable()
export class BookingCreatedHandler {
  private readonly logger = new Logger(BookingCreatedHandler.name);

  @OnEvent(BookingCreatedEvent.EVENT_NAME)
  handle(event: BookingCreatedEvent): void {
    this.logger.log(
      `Booking created: id="${event.bookingId}", provider="${event.providerUserId}", seeker="${event.seekerUserId}", at=${event.occurredAt.toISOString()}`,
    );
  }
}
