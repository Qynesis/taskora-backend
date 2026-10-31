/**
 * Subscription checkout data for Stripe API
 */
export interface SubscriptionCheckoutData {
  customerId: string;
  monthlyAmount: number;
  currency: string;
  durationMonths: number;
  selectionId: string;
  jobId: string;
  seekerId: string;
  providerId: string;
  providerStripeAccountId: string;
  successUrl: string;
  cancelUrl: string;
}

/**
 * Subscription mapping record stored in AuditLog
 */
export interface SubscriptionMappingRecord {
  [key: string]: unknown;
  selectionId: string;
  subscriptionId: string;
  checkoutSessionId: string;
  stripeCustomerId: string;
  durationMonths: number;
  /** Total number of billing cycles (accounts for paymentFrequency × durationMonths) */
  numberOfPeriods: number;
  /** Total contract value in dollars (bid.price) */
  monthlyAmount: number;
  /** Per-cycle installment amount in dollars */
  installmentAmount: number;
  /** Total contract value in dollars */
  totalAmount: number;
  currency: string;
  providerStripeAccountId: string;
  seekerId: string;
  providerId: string;
  jobId: string;
  paymentFrequency?: string;
}

/**
 * Webhook event payload
 */
export interface SubscriptionWebhookPayload {
  stripeEventId: string;
  type: string;
  objectId: string;
}
