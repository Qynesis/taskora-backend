import { BaseEvent } from '../../../events/base.event';

export class BookingCreatedEvent extends BaseEvent {
  static readonly EVENT_NAME = 'booking.created';

  constructor(
    public readonly bookingId: string,
    public readonly providerUserId: string,
    public readonly seekerUserId: string,
  ) {
    super(BookingCreatedEvent.EVENT_NAME);
  }
}
