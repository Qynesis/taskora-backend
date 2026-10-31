import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { DirectMessageCreatedEvent } from '../../conversation/events/direct-message-created.event';
import { NotificationService } from '../notification.service';
import { NotificationType } from '../../../database/common/enum';

@Injectable()
export class DirectMessageNotificationHandler {
  private readonly logger = new Logger(DirectMessageNotificationHandler.name);

  constructor(private readonly notificationService: NotificationService) {}

  @OnEvent(DirectMessageCreatedEvent.EVENT_NAME)
  async handle(event: DirectMessageCreatedEvent): Promise<void> {
    try {
      await this.notificationService.send({
        userId: event.recipientId,
        title: 'New message',
        body: event.payload.body ?? 'You have a new message',
        type: NotificationType.NEW_MESSAGE,
        data: { conversationId: event.conversationId },
      });
    } catch (err) {
      this.logger.error('Failed to send direct-message notification', err);
    }
  }
}
