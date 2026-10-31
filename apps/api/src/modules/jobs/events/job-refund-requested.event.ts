import { RefundRequestReason } from '../../../database/common/enum';
import { BaseEvent } from '../../../events/base.event';

export class JobRefundRequestedEvent extends BaseEvent {
  static readonly EVENT_NAME = 'job.refund-requested';

  constructor(
    public readonly refundRequestId: string,
    public readonly jobId: string,
    public readonly jobTitle: string,
    public readonly seekerId: string,
    public readonly providerId: string,
    public readonly reason: RefundRequestReason,
    public readonly comments?: string | null,
  ) {
    super(JobRefundRequestedEvent.EVENT_NAME);
  }
}
