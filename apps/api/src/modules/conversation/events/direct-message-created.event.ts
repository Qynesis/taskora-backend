import { BaseEvent } from '../../../events/base.event';
import { MessageResponseDto } from '../dto/message-response.dto';

export class DirectMessageCreatedEvent extends BaseEvent {
  static readonly EVENT_NAME = 'conversation.message_created';

  constructor(
    public readonly conversationId: string,
    public readonly payload: MessageResponseDto,
    public readonly recipientId: string,
  ) {
    super(DirectMessageCreatedEvent.EVENT_NAME);
  }
}
