import { BaseEvent } from '../../../events/base.event';
import { JobStatus } from '../../../database/common/enum';

export class JobStatusChangedEvent extends BaseEvent {
  static readonly EVENT_NAME = 'job.status_changed';

  constructor(
    public readonly jobId: string,
    public readonly jobTitle: string,
    public readonly newStatus: JobStatus,
    public readonly seekerId: string,
    public readonly providerId: string | null,
    public readonly initiatedBy: 'seeker' | 'provider' | 'system' = 'system',
  ) {
    super(JobStatusChangedEvent.EVENT_NAME);
  }
}
