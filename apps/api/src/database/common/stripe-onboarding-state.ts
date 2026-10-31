/**
 * Provider-facing Stripe Connect onboarding state.
 *
 *   not_started     — no connected account yet; the provider has not begun onboarding
 *   pending         — Stripe is verifying and needs nothing from the provider. Can last days.
 *   action_required — Stripe is waiting on the provider; see requirementsDue / disabledReason
 *   enabled         — charges and payouts are both live
 *
 * Stored as varchar rather than a Postgres enum: Stripe's own model can grow, and widening a
 * varchar is cheaper than an ALTER TYPE on a live table.
 */
export type StripeOnboardingState = 'not_started' | 'pending' | 'action_required' | 'enabled';
