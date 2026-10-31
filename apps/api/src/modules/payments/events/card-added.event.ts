import { BaseEvent } from '../../../events/base.event';

/**
 * Domain event emitted when a payment card is successfully added to the saved payment methods
 * Triggered after setup_intent.succeeded webhook is received from Stripe
 */
export class CardAddedEvent extends BaseEvent {
  static readonly EVENT_NAME = 'card.added';

  constructor(
    public readonly userId: string,
    public readonly stripePaymentMethodId: string,
    public readonly setupIntentId: string,
    public readonly brand: string,
    public readonly last4: string,
    public readonly expMonth: number,
    public readonly expYear: number,
    public readonly fingerprint: string | null = null,
  ) {
    super(CardAddedEvent.EVENT_NAME);
  }
}
