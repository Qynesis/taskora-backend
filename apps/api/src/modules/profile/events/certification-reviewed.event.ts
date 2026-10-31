import { BaseEvent } from '../../../events/base.event';
import { CertificationStatus } from '../../../database/common/enum';

export class CertificationReviewedEvent extends BaseEvent {
  static readonly EVENT_NAME = 'certification.reviewed';

  constructor(
    public readonly profileId: string,
    public readonly certificationId: string,
    public readonly certificationName: string,
    public readonly status: CertificationStatus,
    public readonly actorUserId?: string,
  ) {
    super(CertificationReviewedEvent.EVENT_NAME);
  }
}
