import { BaseEvent } from '../../../events/base.event';

export class BillingCustomerCreatedEvent extends BaseEvent {
  static readonly EVENT_NAME = 'billing.customer.created';

  constructor(
    public readonly customerId: string,
    public readonly seekerUserId: string,
  ) {
    super(BillingCustomerCreatedEvent.EVENT_NAME);
  }
}
