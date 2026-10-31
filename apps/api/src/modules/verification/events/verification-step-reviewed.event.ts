import { BaseEvent } from '../../../events/base.event';
import { VerificationStatus, VerificationStepType, RejectionReason } from '../../../database/common/enum';

export class VerificationStepReviewedEvent extends BaseEvent {
  static readonly EVENT_NAME = 'verification.step_reviewed';

  constructor(
    public readonly stepId: string,
    public readonly profileId: string,
    public readonly stepType: VerificationStepType,
    public readonly status: VerificationStatus.APPROVED | VerificationStatus.REJECTED,
    public readonly rejectionReason?: RejectionReason | null,
    public readonly rejectionNote?: string | null,
    public readonly actorUserId?: string,
  ) {
    super(VerificationStepReviewedEvent.EVENT_NAME);
  }
}
