import { StripeOnboardingState } from '../../../database/common/stripe-onboarding-state';

export interface StripeOnboardingStatus {
  /** Shorthand for state === 'enabled'. Kept for the existing clients that read it. */
  onboarded: boolean;
  state: StripeOnboardingState;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  /** Stripe requirement keys the provider still has to supply. Empty unless state is action_required. */
  requirementsDue: string[];
  disabledReason: string | null;
  onboardingCompletedAt: Date | null;
  /** When requirementsDue/state last came from Stripe. Null on a never-synced account. */
  requirementsSyncedAt: Date | null;
  email: string | null;
}
