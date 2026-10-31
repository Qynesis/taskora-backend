import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { ChatGateway } from '../../messages/chat.gateway';
import { ConversationService } from '../conversation.service';
import { DirectMessageCreatedEvent } from './direct-message-created.event';

@Injectable()
export class DirectMessageCreatedHandler {
  constructor(
    private readonly chatGateway: ChatGateway,
    private readonly conversationService: ConversationService,
  ) {}

  @OnEvent(DirectMessageCreatedEvent.EVENT_NAME)
  async handle(event: DirectMessageCreatedEvent): Promise<void> {
    this.chatGateway.broadcastToConversation(event.conversationId, event.payload);
    this.chatGateway.broadcastToUser(event.recipientId, {
      type: 'new_direct_message',
      conversationId: event.conversationId,
      preview: event.payload.body.slice(0, 100),
    });

    const unreadCount = await this.conversationService.unreadMessageCount(event.recipientId);
    this.chatGateway.broadcastMessageBadge(event.recipientId, unreadCount);
  }
}
