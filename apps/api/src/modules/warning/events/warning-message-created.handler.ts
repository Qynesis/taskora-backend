import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { WarningMessageCreatedEvent } from './warning-message-created.event';
import { ChatGateway } from '../../messages/chat.gateway';
import { WarningThreadService } from '../warning-thread.service';
import { WarningSenderType } from '../../../database/common/enum';

@Injectable()
export class WarningMessageCreatedHandler {
  private readonly logger = new Logger(WarningMessageCreatedHandler.name);

  constructor(
    private readonly chatGateway: ChatGateway,
    private readonly warningThreadService: WarningThreadService,
  ) {}

  @OnEvent(WarningMessageCreatedEvent.EVENT_NAME)
  async handle(event: WarningMessageCreatedEvent): Promise<void> {
    this.logger.log(`Warning message created in thread="${event.threadId}"`);
    this.chatGateway.broadcastToWarningThread(event.threadId, event.message);

    if (event.senderType === WarningSenderType.ADMIN) {
      const count = await this.warningThreadService.unreadCount(event.recipientId);
      this.chatGateway.broadcastWarningBadge(event.recipientId, count);
    }

    // A user reply raises the admin queue; an admin reply clears the thread from it — refresh either way.
    const adminCount = await this.warningThreadService.adminUnreadCount();
    this.chatGateway.broadcastAdminWarningBadge(adminCount);
  }
}
