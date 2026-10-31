import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationService } from '../notification.service';
import { NotificationType } from '../../../database/common/enum';
import { Selection } from '../../../database/entities/selection.entity';
import {
  SubscriptionCreatedFromCheckoutEvent,
  SubscriptionEndedEvent,
  SubscriptionInvoicePaidEvent,
  SubscriptionPaymentFailedEvent,
} from '../../subscriptions/events/subscription-payment.events';

@Injectable()
export class SubscriptionNotificationHandler {
  private readonly logger = new Logger(SubscriptionNotificationHandler.name);

  constructor(
    private readonly notificationService: NotificationService,
    @InjectRepository(Selection)
    private readonly selectionRepository: Repository<Selection>,
  ) {}

  @OnEvent(SubscriptionCreatedFromCheckoutEvent.EVENT_NAME)
  async onActivated(event: SubscriptionCreatedFromCheckoutEvent): Promise<void> {
    const providerId = await this.resolveProviderId(event.selectionId);
    if (!providerId) return;
    try {
      await this.notificationService.send({
        userId: providerId,
        title: 'Subscription activated',
        body: `Your ${event.durationMonths}-month subscription is now active. You're all set to receive jobs.`,
        type: NotificationType.SUBSCRIPTION_ACTIVATED,
        data: { selectionId: event.selectionId, subscriptionId: event.subscriptionId },
      });
    } catch (err) {
      this.logger.error('Failed to send subscription-activated notification', err);
    }
  }

  @OnEvent(SubscriptionInvoicePaidEvent.EVENT_NAME)
  async onInvoicePaid(event: SubscriptionInvoicePaidEvent): Promise<void> {
    const providerId = await this.resolveProviderId(event.selectionId);
    if (!providerId) return;
    try {
      await this.notificationService.send({
        userId: providerId,
        title: 'Payment processed',
        body: `You have received a subscription payment of $${event.providerPayout.toFixed(2)} (cycle ${event.paidCycles} of ${event.durationMonths}).`,
        type: NotificationType.SUBSCRIPTION_INVOICE_PAID,
        data: { selectionId: event.selectionId, invoiceId: event.invoiceId, paymentId: event.paymentId },
      });
    } catch (err) {
      this.logger.error('Failed to send subscription-invoice-paid notification', err);
    }
  }

  @OnEvent(SubscriptionPaymentFailedEvent.EVENT_NAME)
  async onPaymentFailed(event: SubscriptionPaymentFailedEvent): Promise<void> {
    
    const seekerId = await this.resolveSeekerId(event.selectionId);
    
    if (!seekerId) return;
    try {
      await this.notificationService.send({
        userId: seekerId,
        title: 'Payment failed',
        body: `Your subscription payment of $${event.amount.toFixed(2)} failed. Tap to update your payment method and keep your subscription active.`,
        type: NotificationType.SUBSCRIPTION_PAYMENT_FAILED,
        data: {
          selectionId: event.selectionId,
          invoiceId: event.invoiceId,
          ...(event.hostedInvoiceUrl ? { hostedInvoiceUrl: event.hostedInvoiceUrl } : {}),
        },
      });
    } catch (err) {
      this.logger.error('Failed to send subscription-payment-failed notification', err);
    }
  }

  @OnEvent(SubscriptionEndedEvent.EVENT_NAME)
  async onEnded(event: SubscriptionEndedEvent): Promise<void> {
    const providerId = await this.resolveProviderId(event.selectionId);
    if (!providerId) return;
    const isCancelled = event.outcome === 'cancelled';
    try {
      await this.notificationService.send({
        userId: providerId,
        title: isCancelled ? 'Subscription cancelled' : 'Subscription completed',
        body: isCancelled
          ? 'Your subscription has been cancelled.'
          : `Your subscription has completed all ${event.paidCycles} payment cycles.`,
        type: NotificationType.SUBSCRIPTION_ENDED,
        data: { selectionId: event.selectionId, subscriptionId: event.subscriptionId, outcome: event.outcome },
      });
    } catch (err) {
      this.logger.error('Failed to send subscription-ended notification', err);
    }
  }

  private async resolveProviderId(selectionId: string): Promise<string | null> {
    const selection = await this.selectionRepository.findOne({
      where: { id: selectionId } as any,
      relations: { provider: true } as any,
    });
    if (!selection) {
      this.logger.warn(`Selection ${selectionId} not found — skipping subscription notification`);
      return null;
    }
    return (selection.provider as any).id;
  }

  // selectedBy is the seeker (the payer) — used for payment-related prompts.
  private async resolveSeekerId(selectionId: string): Promise<string | null> {
    const selection = await this.selectionRepository.findOne({
      where: { id: selectionId } as any,
      relations: { selectedBy: true } as any,
    });
    if (!selection) {
      this.logger.warn(`Selection ${selectionId} not found — skipping subscription notification`);
      return null;
    }
    return (selection.selectedBy as any)?.id ?? null;
  }
}
