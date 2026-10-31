import { BaseEvent } from '../../../events/base.event';

export class CategoryCreatedEvent extends BaseEvent {
  static readonly EVENT_NAME = 'category.created';

  constructor(
    public readonly categoryId: string,
    public readonly name: string,
  ) {
    super(CategoryCreatedEvent.EVENT_NAME);
  }
}
