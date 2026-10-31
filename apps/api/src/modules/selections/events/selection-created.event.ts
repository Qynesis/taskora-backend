import { BaseEvent } from '../../../events/base.event';

export class SelectionCreatedEvent extends BaseEvent {
  static readonly EVENT_NAME = 'selection.created';

  constructor(
    public readonly selectionId: string,
    public readonly name: string,
    public readonly actorUserId?: string,
  ) {
    super(SelectionCreatedEvent.EVENT_NAME);
  }
}
