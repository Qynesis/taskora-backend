import { BaseEvent } from '../../../events/base.event';

export class JobCreatedEvent extends BaseEvent {
  static readonly EVENT_NAME = 'job.created';

  constructor(
    public readonly jobId: string,
    public readonly name: string,
  ) {
    super(JobCreatedEvent.EVENT_NAME);
  }
}
