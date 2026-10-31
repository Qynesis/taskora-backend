import { BaseEvent } from '../../../events/base.event';

export class RefundRejectedEvent extends BaseEvent {
  static readonly EVENT_NAME = 'job.refund_rejected';

  constructor(
    public readonly refundRequestId: string,
    public readonly jobId: string,
    public readonly jobTitle: string,
    public readonly seekerId: string,
    public readonly actorUserId?: string,
  ) {
    super(RefundRejectedEvent.EVENT_NAME);
  }
}
