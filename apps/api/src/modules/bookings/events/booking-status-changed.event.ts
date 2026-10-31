import { BaseEvent } from '../../../events/base.event';
import { JobStatus } from '../../../database/common/enum';

export class BookingStatusChangedEvent extends BaseEvent {
  static readonly EVENT_NAME = 'booking.status_changed';

  constructor(
    public readonly bookingId: string,
    public readonly seekerId: string,
    public readonly providerId: string,
    public readonly newStatus: JobStatus,
    public readonly actorUserId?: string,
  ) {
    super(BookingStatusChangedEvent.EVENT_NAME);
  }
}
