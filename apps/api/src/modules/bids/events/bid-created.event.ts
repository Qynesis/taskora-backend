import { BaseEvent } from '../../../events/base.event';

export class BidCreatedEvent extends BaseEvent {
  static readonly EVENT_NAME = 'bid.created';

  constructor(
    public readonly bidId: string,
    public readonly jobId: string,
    public readonly providerId: string,
    public readonly price: number,
    public readonly currency: string,
    public readonly message?: string,
  ) {
    super(BidCreatedEvent.EVENT_NAME);
  }
}
