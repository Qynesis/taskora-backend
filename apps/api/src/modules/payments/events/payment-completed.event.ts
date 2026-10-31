import { BaseEvent } from "../../../events";
import { PaymentCompletedInterface } from "../interfaces/payment-completed.inteface";

export class PaymentCompletedEvent extends BaseEvent {
  static readonly EVENT_NAME = 'payment.completed';

  constructor(public readonly paymentCompletedInterface: PaymentCompletedInterface) {
    super(PaymentCompletedEvent.EVENT_NAME);
  }
}