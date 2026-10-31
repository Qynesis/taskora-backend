import { BaseEvent } from '../../../events/base.event';
import { ReportStatus } from '../../../database/common/enum';

export class ReportStatusChangedEvent extends BaseEvent {
  static readonly EVENT_NAME = 'report.status_changed';

  constructor(
    public readonly reportId: string,
    public readonly newStatus: ReportStatus,
    public readonly actorUserId?: string,
  ) {
    super(ReportStatusChangedEvent.EVENT_NAME);
  }
}
