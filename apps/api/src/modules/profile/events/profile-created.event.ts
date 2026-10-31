import { BaseEvent } from '../../../events/base.event';

export class ProfileCreatedEvent extends BaseEvent {
  static readonly EVENT_NAME = 'profile.created';

  constructor(
    public readonly profileId: string,
    public readonly name: string,
    public readonly userId?: string,
  ) {
    super(ProfileCreatedEvent.EVENT_NAME);
  }
}
