import { BaseEvent } from '../../../events/base.event';

export class PaymentCreatedEvent extends BaseEvent {
  static readonly EVENT_NAME = 'payment.created';

  constructor(
    public readonly paymentId: string,
    public readonly seekerId: string,
    public readonly providerId: string,
    public readonly amount: number,
    public readonly providerAmount: number,
    public readonly jobTitle: string | null,
  ) {
    super(PaymentCreatedEvent.EVENT_NAME);
  }
}
