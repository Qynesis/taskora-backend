import { BaseEvent } from '../../../events/base.event';
import { BidStatus } from '../../../database/common/enum';

export class BidStatusChangedEvent extends BaseEvent {
  static readonly EVENT_NAME = 'bid.status_changed';

  constructor(
    public readonly bidId: string,
    public readonly jobId: string,
    public readonly jobTitle: string,
    public readonly providerId: string,
    public readonly oldStatus: BidStatus,
    public readonly newStatus: BidStatus,
    public readonly actorUserId?: string,
  ) {
    super(BidStatusChangedEvent.EVENT_NAME);
  }
}
