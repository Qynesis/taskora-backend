import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { NotificationService } from '../notification.service';
import { CardAddedEvent } from '../../payments/events/card-added.event';
import { NotificationType } from '../../../database/common/enum';

@Injectable()
export class CardAddedNotificationHandler {
  private readonly logger = new Logger(CardAddedNotificationHandler.name);

  constructor(private readonly notificationService: NotificationService) {}

  @OnEvent(CardAddedEvent.EVENT_NAME)
  async handle(event: CardAddedEvent): Promise<void> {
    try {
      await this.notificationService.send({
        userId: event.userId,
        title: 'Card added successfully',
        body: `Your ${event.brand.charAt(0).toUpperCase() + event.brand.slice(1)} card ending in ${event.last4} has been saved to your account.`,
        type: NotificationType.CARD_ADDED,
        data: {
          stripePaymentMethodId: event.stripePaymentMethodId,
          brand: event.brand,
          last4: event.last4,
        },
      });
    } catch (err) {
      this.logger.error('Failed to send card-added notification', err);
    }
  }
}
