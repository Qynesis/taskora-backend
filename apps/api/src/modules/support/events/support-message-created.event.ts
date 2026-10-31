import { BaseEvent } from '../../../events/base.event';
import { SupportSenderType } from '../../../database/common/enum';

export class SupportMessageCreatedEvent extends BaseEvent {
  static readonly EVENT_NAME = 'support.message_created';

  constructor(
    public readonly ticketId: string,
    public readonly payload: unknown,
    public readonly senderType: SupportSenderType,
    public readonly ticketOwnerId: string,
  ) {
    super(SupportMessageCreatedEvent.EVENT_NAME);
  }
}
