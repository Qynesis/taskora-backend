import { BaseEvent } from '../../../events/base.event';

export class CertificationSubmittedEvent extends BaseEvent {
  static readonly EVENT_NAME = 'certification.submitted';

  constructor(
    public readonly profileId: string,
    public readonly certificationId: string,
    public readonly certificationName: string,
    public readonly isUpdate: boolean,
  ) {
    super(CertificationSubmittedEvent.EVENT_NAME);
  }
}
