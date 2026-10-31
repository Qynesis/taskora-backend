import { BaseEvent } from '../../../events/base.event';

export class ReportWarningSentEvent extends BaseEvent {
  static readonly EVENT_NAME = 'report.warning_sent';

  constructor(
    public readonly recipientUserId: string,
    public readonly warningId: string,
    public readonly threadId: string,
    public readonly message: string,
    public readonly reportRef: string,
    public readonly suspensionDeadline: Date,
    public readonly actorUserId?: string,
  ) {
    super(ReportWarningSentEvent.EVENT_NAME);
  }
}
