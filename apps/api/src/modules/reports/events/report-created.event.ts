import { BaseEvent } from '../../../events/base.event';

export class ReportCreatedEvent extends BaseEvent {
  static readonly EVENT_NAME = 'report.created';

  constructor(
    public readonly reportId: string,
    public readonly name: string,
    public readonly actorUserId?: string,
  ) {
    super(ReportCreatedEvent.EVENT_NAME);
  }
}
