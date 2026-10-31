import { BaseEvent } from '../../../events/base.event';
import { VerificationStepType } from '../../../database/common/enum';

export class VerificationStepSubmittedEvent extends BaseEvent {
  static readonly EVENT_NAME = 'verification.step_submitted';

  constructor(
    public readonly profileId: string,
    public readonly stepType: VerificationStepType,
  ) {
    super(VerificationStepSubmittedEvent.EVENT_NAME);
  }
}
