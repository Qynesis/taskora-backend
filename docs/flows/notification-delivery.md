# Flow Spec: Notification Delivery

## Goal
Document in-app notification persistence and optional FCM push delivery.

## Token Management
1. Device registers FCM token with optional platform value.
2. Existing token is reassigned to current user when needed.
3. Token removal endpoint deletes token for current user.

## Send Flow
1. Notification record is always persisted in DB first.
2. If Firebase app is configured, service sends multicast push to all user tokens.
3. Invalid tokens are removed after send response analysis.
4. `sentAt` timestamp is updated when send attempt succeeds.

## Read Flow
1. User fetches paginated notification list.
2. User marks one notification read or marks all as read.

## Invariants
1. Missing FCM credentials does not block in-app notification persistence.
2. Delivery failure does not delete notification history.
3. Push notifications are for **async events only** — actions confirmed by an API response do not generate a push to the same user.
4. `JobStatusChangedEvent` carries `initiatedBy` (`'seeker' | 'provider' | 'system'`) — the handler skips notifying the party that triggered the change.

## Event → Notification Coverage

| Event | Triggered by | Who is notified | NotificationType |
|---|---|---|---|
| `BidCreatedEvent` | Provider submits bid | Seeker — "New bid received" | `BID_RECEIVED` |
| `BidUpdatedEvent` | Provider revises bid | Seeker — "Bid revised" | `BID_RECEIVED` |
| `BidStatusChangedEvent (ACCEPTED)` | Selection created | Provider — "Bid accepted" | `BID_ACCEPTED` |
| `BidStatusChangedEvent (DECLINED)` | Selection or direct decline | Provider — "Bid declined" | `BID_DECLINED` |
| `BookingCreatedEvent` | Seeker creates booking | Provider only — "New booking" | `BOOKING_CONFIRMED` |
| `BookingStatusChangedEvent` | Provider updates status | Seeker — "Booking accepted/rejected/completed" | `BOOKING_STATUS_CHANGED` |
| `BookingStatusChangedEvent` | Seeker cancels booking | Provider — "Booking cancelled" | `BOOKING_STATUS_CHANGED` |
| `JobStatusChangedEvent (IN_PROGRESS)` | Provider starts job | Seeker — "Job started" | `JOB_STARTED` |
| `JobStatusChangedEvent (COMPLETED)` | Provider completes job | Seeker — "Job completed" | `JOB_COMPLETED` |
| `JobStatusChangedEvent (CANCELLED)` | Seeker cancels job | Provider — "Job cancelled" | `JOB_CANCELLED` |
| `JobRefundRequestedEvent` | Seeker requests refund | Provider — "Refund request submitted" | `REFUND_REQUESTED` |
| `RefundRejectedEvent` | Provider rejects refund | Seeker — "Refund request rejected" | `REFUND_REJECTED` |
| `PaymentCreatedEvent` | Payment webhook settled | Both seeker ("Payment processed") and provider ("Payment received") | `PAYMENT_RECEIVED` |
| `DirectMessageCreatedEvent` | Either party sends message | Recipient — "New message" | `NEW_MESSAGE` |
| `ReportWarningSentEvent` | Admin sends warning | Subject user — "Warning received" | `WARNING_RECEIVED` |
| `WarningMessageCreatedEvent` | Admin sends thread message | Recipient user — "New warning message" | `WARNING_THREAD_MESSAGE` |
| `ReportStatusChangedEvent` | Admin resolves/dismisses report | Reporter — "Report resolved/dismissed" | `REPORT_RESOLVED` |
| `SupportMessageCreatedEvent` | Admin replies to ticket | Ticket owner — "Support replied" | `SUPPORT_REPLY` |
| `CardAddedEvent` | Card setup webhook | Card owner — "Card added" (security alert) | `CARD_ADDED` |
| `SubscriptionCreatedFromCheckoutEvent` | Stripe checkout completed | Provider — "Subscription activated" | `SUBSCRIPTION_ACTIVATED` |
| `SubscriptionInvoicePaidEvent` | Stripe invoice paid | Provider — "Payment processed (cycle N)" | `SUBSCRIPTION_INVOICE_PAID` |
| `SubscriptionPaymentFailedEvent` | Stripe payment failed | Provider — "Payment failed" | `SUBSCRIPTION_PAYMENT_FAILED` |
| `SubscriptionEndedEvent` | Stripe subscription ended | Provider — "Subscription completed/cancelled" | `SUBSCRIPTION_ENDED` |
| `VerificationStepReviewedEvent` | Admin reviews step | Provider — "Verification approved/rejected" | `VERIFICATION_REVIEWED` |

## Related Tables
- `notifications`
- `fcm_tokens`
