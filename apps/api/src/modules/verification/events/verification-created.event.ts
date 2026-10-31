import { BaseEvent } from '../../../events/base.event';

export class VerificationCreatedEvent extends BaseEvent {
  static readonly EVENT_NAME = 'verification.created';

  constructor(
    public readonly verificationId: string,
    public readonly name: string,
    public readonly actorUserId?: string,
  ) {
    super(VerificationCreatedEvent.EVENT_NAME);
  }
}
