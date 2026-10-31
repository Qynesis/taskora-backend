import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { SupportMessageCreatedEvent } from '../../support/events/support-message-created.event';
import { NotificationService } from '../notification.service';
import { NotificationType, SupportSenderType } from '../../../database/common/enum';

@Injectable()
export class SupportMessageNotificationHandler {
  private readonly logger = new Logger(SupportMessageNotificationHandler.name);

  constructor(private readonly notificationService: NotificationService) {}

  @OnEvent(SupportMessageCreatedEvent.EVENT_NAME)
  async handle(event: SupportMessageCreatedEvent): Promise<void> {
    if (event.senderType !== SupportSenderType.ADMIN || !event.ticketOwnerId) return;

    try {
      await this.notificationService.send({
        userId: event.ticketOwnerId,
        title: 'Support replied',
        body: 'Support has replied to your ticket. Tap to view.',
        type: NotificationType.SUPPORT_REPLY,
        data: { ticketId: event.ticketId },
      });
    } catch (err) {
      this.logger.error('Failed to send support-message notification', err);
    }
  }
}
