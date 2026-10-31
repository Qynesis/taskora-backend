import { BaseEvent } from '../../../events/base.event';

export class SubscriptionCreatedFromCheckoutEvent extends BaseEvent {
  static readonly EVENT_NAME = 'subscription.created_from_checkout';

  constructor(
    public readonly selectionId: string,
    public readonly subscriptionId: string,
    public readonly checkoutSessionId: string,
    public readonly durationMonths: number,
  ) {
    super(SubscriptionCreatedFromCheckoutEvent.EVENT_NAME);
  }
}

export class SubscriptionInvoicePaidEvent extends BaseEvent {
  static readonly EVENT_NAME = 'subscription.invoice_paid';

  constructor(
    public readonly selectionId: string,
    public readonly invoiceId: string,
    public readonly paymentId: string,
    public readonly amount: number,
    public readonly providerPayout: number,
    public readonly paidCycles: number,
    public readonly durationMonths: number,
  ) {
    super(SubscriptionInvoicePaidEvent.EVENT_NAME);
  }
}

export class SubscriptionPaymentFailedEvent extends BaseEvent {
  static readonly EVENT_NAME = 'subscription.payment_failed';

  constructor(
    public readonly selectionId: string,
    public readonly invoiceId: string,
    public readonly amount: number,
    public readonly hostedInvoiceUrl: string | null = null,
  ) {
    super(SubscriptionPaymentFailedEvent.EVENT_NAME);
  }
}

export class SubscriptionEndedEvent extends BaseEvent {
  static readonly EVENT_NAME = 'subscription.ended';

  constructor(
    public readonly selectionId: string,
    public readonly subscriptionId: string,
    public readonly outcome: 'completed' | 'cancelled',
    public readonly paidCycles: number,
    public readonly durationMonths: number,
  ) {
    super(SubscriptionEndedEvent.EVENT_NAME);
  }
}
