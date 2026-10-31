import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PaymentCreatedEvent } from './payment-created.event';

@Injectable()
export class PaymentCreatedHandler {
  private readonly logger = new Logger(PaymentCreatedHandler.name);

  @OnEvent(PaymentCreatedEvent.EVENT_NAME)
  handle(event: PaymentCreatedEvent): void {
    this.logger.log(
      `Payment created: id="${event.paymentId}", at=${event.occurredAt.toISOString()}`,
    );
  }
}
