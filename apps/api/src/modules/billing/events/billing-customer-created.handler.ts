import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { BillingCustomerCreatedEvent } from './billing-customer-created.event';

@Injectable()
export class BillingCustomerCreatedHandler {
  private readonly logger = new Logger(BillingCustomerCreatedHandler.name);

  @OnEvent(BillingCustomerCreatedEvent.EVENT_NAME)
  handle(event: BillingCustomerCreatedEvent): void {
    this.logger.log(
      `Billing customer created: customerId="${event.customerId}", seekerUserId="${event.seekerUserId}", at=${event.occurredAt.toISOString()}`,
    );
  }
}
