import { BaseEvent } from '../../../events/base.event';

export class ReviewCreatedEvent extends BaseEvent {
  static readonly EVENT_NAME = 'review.created';

  constructor(
    public readonly reviewId: string,
    /** users.id of the provider being reviewed. */
    public readonly providerId: string,
    public readonly seekerId: string,
    public readonly rating: number,
  ) {
    super(ReviewCreatedEvent.EVENT_NAME);
  }
}
