import { BaseEvent } from '../../../events/base.event';

export class UserSyncedEvent extends BaseEvent {
  static readonly EVENT_NAME = 'user.synced';

  constructor(
    public readonly userId: string,
    public readonly email: string,
    /** True when the user row was created for the first time. */
    public readonly isNew: boolean,
  ) {
    super(UserSyncedEvent.EVENT_NAME);
  }
}
