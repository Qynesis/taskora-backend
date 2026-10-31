import { BaseEvent } from '../../../events/base.event';

export class BidUpdatedEvent extends BaseEvent {
  static readonly EVENT_NAME = 'bid.updated';

  constructor(
    public readonly bidId: string,
    public readonly jobId: string,
    public readonly seekerId: string,
    public readonly providerId: string,
    public readonly price: number,
    public readonly currency: string,
    public readonly message?: string,
  ) {
    super(BidUpdatedEvent.EVENT_NAME);
  }
}
