import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { NotificationService } from '../notification.service';
import { NotificationType } from '../../../database/common/enum';
import { PaymentCreatedEvent } from '../../payments/events/payment-created.event';

@Injectable()
export class PaymentNotificationHandler {
  private readonly logger = new Logger(PaymentNotificationHandler.name);

  constructor(private readonly notificationService: NotificationService) {}

  @OnEvent(PaymentCreatedEvent.EVENT_NAME)
  async handle(event: PaymentCreatedEvent): Promise<void> {
    const jobLabel = event.jobTitle ? `"${event.jobTitle}"` : 'your job';
    const seekerAmount = `$${event.amount.toFixed(2)}`;
    const providerAmount = `$${event.providerAmount.toFixed(2)}`;

    try {
      await Promise.all([
        this.notificationService.send({
          userId: event.seekerId,
          title: 'Payment processed',
          body: `Your payment of ${seekerAmount} for ${jobLabel} has been processed.`,
          type: NotificationType.PAYMENT_RECEIVED,
          data: { paymentId: event.paymentId },
        }),
        this.notificationService.send({
          userId: event.providerId,
          title: 'Payment received',
          body: `You have received a payment of ${providerAmount} for ${jobLabel}.`,
          type: NotificationType.PAYMENT_RECEIVED,
          data: { paymentId: event.paymentId },
        }),
      ]);
    } catch (err) {
      this.logger.error('Failed to send payment notification', err);
    }
  }
}
