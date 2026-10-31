import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PaymentCompletedEvent } from './events/payment-completed.event';
import { PaymentService } from './payment.service';

@Injectable()
export class PaymentEventListener {
  private readonly logger = new Logger(PaymentEventListener.name);

  constructor(private readonly paymentService: PaymentService) {}

  @OnEvent(PaymentCompletedEvent.EVENT_NAME)
  async onPaymentCompleted(event: PaymentCompletedEvent): Promise<void> {
    try {
      await this.paymentService.onPaymentCompleted(event.paymentCompletedInterface);
    } catch (err) {
      this.logger.error(
        `Failed to process payment completion for intent`,
      );
    }
  }
}
