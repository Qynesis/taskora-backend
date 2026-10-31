/**
 * Interface for Stripe Checkout Session creation (setup mode)
 */
export interface CreateSetupCheckoutData {
  customerId: string;
  userId: string;
  successUrl: string;
  cancelUrl: string;
}

/**
 * Interface for Stripe Checkout Session response
 */
export interface SetupCheckoutResponse {
  checkoutUrl: string;
  sessionId: string;
}

/**
 * Interface for setup_intent.succeeded webhook event data
 */
export interface SetupIntentSucceededInterface {
  setupIntentId: string;
  customerId: string;
  paymentMethodId: string;
  userId: string;
}
