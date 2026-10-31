import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { NotificationService } from '../notification.service';
import { StripeAccountStatusChangedEvent } from '../../stripe/events/stripe-account-status-changed.event';
import { NotificationType } from '../../../database/common/enum';

@Injectable()
export class StripeAccountStatusNotificationHandler {
  private readonly logger = new Logger(StripeAccountStatusNotificationHandler.name);

  constructor(private readonly notificationService: NotificationService) {}

  @OnEvent(StripeAccountStatusChangedEvent.EVENT_NAME)
  async handle(event: StripeAccountStatusChangedEvent): Promise<void> {
    try {
      if (event.status === 'enabled') {
        await this.notificationService.send({
          userId: event.providerUserId,
          title: 'Payout account verified',
          body: 'Your payout account is verified — you can now receive payments for completed jobs.',
          type: NotificationType.PAYOUT_ENABLED,
          data: { stripeAccountId: event.stripeAccountId, status: event.status },
        });
      } else {
        await this.notificationService.send({
          userId: event.providerUserId,
          title: 'Action needed on your payout account',
          body: 'Your payout account needs attention before you can receive payments. Please complete the outstanding requirements to continue.',
          type: NotificationType.PAYOUT_ACTION_REQUIRED,
          data: {
            stripeAccountId: event.stripeAccountId,
            status: event.status,
            ...(event.disabledReason ? { reason: event.disabledReason } : {}),
          },
        });
      }
    } catch (err) {
      this.logger.error('Failed to send Stripe account status notification', err);
    }
  }
}
