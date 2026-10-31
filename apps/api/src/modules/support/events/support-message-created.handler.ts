import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { SupportMessageCreatedEvent } from './support-message-created.event';
import { ChatGateway } from '../../messages/chat.gateway';
import { SupportTicketService } from '../support-ticket.service';
import { SupportSenderType } from '../../../database/common/enum';

@Injectable()
export class SupportMessageCreatedHandler {
  private readonly logger = new Logger(SupportMessageCreatedHandler.name);

  constructor(
    private readonly chatGateway: ChatGateway,
    private readonly supportTicketService: SupportTicketService,
  ) {}

  @OnEvent(SupportMessageCreatedEvent.EVENT_NAME)
  async handle(event: SupportMessageCreatedEvent): Promise<void> {
    this.logger.log(`Support message created in ticket="${event.ticketId}"`);
    this.chatGateway.broadcastToSupportTicket(event.ticketId, event.payload);

    if (event.senderType === SupportSenderType.ADMIN) {
      const count = await this.supportTicketService.unreadCount(event.ticketOwnerId);
      this.chatGateway.broadcastSupportBadge(event.ticketOwnerId, count);
    }

    // Either direction changes the admin queue (user reply raises it, admin reply clears the ticket),
    // so refresh the admin-team badge on every message.
    const adminCount = await this.supportTicketService.adminUnreadCount();
    this.chatGateway.broadcastAdminSupportBadge(adminCount);
  }
}
