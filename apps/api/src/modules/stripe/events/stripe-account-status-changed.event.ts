import { BaseEvent } from '../../../events/base.event';

export type StripeAccountStatus = 'enabled' | 'action_required';

/**
 * Emitted from the `account.updated` webhook handler when a provider's Stripe Connect account
 * crosses a meaningful payout boundary:
 *  - 'enabled': payouts + charges became enabled for the first time — the provider can now be paid.
 *  - 'action_required': a previously-enabled account was restricted (payouts/charges revoked) and
 *    the provider needs to resolve outstanding requirements.
 *
 * Intentionally only fires on transitions (not on every account.updated event), so the provider
 * is notified once per meaningful change rather than on each intermediate verification step.
 */
export class StripeAccountStatusChangedEvent extends BaseEvent {
  static readonly EVENT_NAME = 'stripe.account.status_changed';

  constructor(
    public readonly providerUserId: string,
    public readonly status: StripeAccountStatus,
    public readonly stripeAccountId: string,
    public readonly disabledReason: string | null = null,
  ) {
    super(StripeAccountStatusChangedEvent.EVENT_NAME);
  }
}
