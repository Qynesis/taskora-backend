# Module Specifications

This document extends the flow specs to cover all major API modules, not only jobs.

## Module Catalog
| Module | What it owns | Primary entities | Detailed spec |
|---|---|---|---|
| Users | User sync, activation/suspension, notification prefs | users, user_notification_settings | [flows/account-and-billing-onboarding.md](flows/account-and-billing-onboarding.md) |
| Profile | Provider profile, work info, bank details, certifications | profiles, provider_* tables | [flows/account-and-billing-onboarding.md](flows/account-and-billing-onboarding.md) |
| Billing | Stripe customer mapping | stripe_customers | [flows/account-and-billing-onboarding.md](flows/account-and-billing-onboarding.md) |
| Subscriptions | Stripe subscription checkout/query/cancel + subscription webhook handling | subscriptions, subscription_periods | [flows/account-and-billing-onboarding.md](flows/account-and-billing-onboarding.md) |
| Jobs | Bidding job lifecycle and contract setup | jobs, job_photos, job_contracts | [flows/job-lifecycle.md](flows/job-lifecycle.md) |
| Bids | Provider bid submission and listing | bids | [flows/bidding-and-selection.md](flows/bidding-and-selection.md) |
| Selections | Winning bid selection and side-effects | selections, payments | [flows/bidding-and-selection.md](flows/bidding-and-selection.md) |
| Bookings | Direct seeker->provider bookings | jobs(type=direct), job_photos | [flows/direct-booking-flow.md](flows/direct-booking-flow.md) |
| Payments | One-off checkout and webhook settlement | payments, saved_payment_methods | [flows/payment-flow.md](flows/payment-flow.md) |
| Conversation | 1:1 seeker-provider inbox and direct messages | conversations, direct_messages | [flows/conversation-and-messaging.md](flows/conversation-and-messaging.md) |
| Reports | User reports and moderation state | user_reports | [flows/report-warning-moderation.md](flows/report-warning-moderation.md) |
| Warning | Warning thread lifecycle and replies | user_warnings, warning_threads, warning_messages | [flows/report-warning-moderation.md](flows/report-warning-moderation.md) |
| Support | Support tickets and admin/user chat | support_tickets, support_messages | [flows/support-and-admin-reply.md](flows/support-and-admin-reply.md) |
| Notification | Push + in-app notification persistence | notifications, fcm_tokens | [flows/notification-delivery.md](flows/notification-delivery.md) |
| Reviews | Post-completion provider ratings | reviews | [flows/review-and-audit.md](flows/review-and-audit.md) |
| Audit | Append-only audit logging | audit_logs | [flows/review-and-audit.md](flows/review-and-audit.md) |
| Verification | Provider KYC steps and admin review | provider_verification_* | [flows/provider-onboarding.md](flows/provider-onboarding.md) |
| Categories | Reference taxonomy for services | categories | [flows/reference-data.md](flows/reference-data.md) |
| Skills | Reference taxonomy for skills | skills | [flows/reference-data.md](flows/reference-data.md) |

## Webhook Architecture Note
All Stripe webhook events are handled in a single endpoint `POST /api/webhook/stripe` (`WebhookController`):
- `payment_intent.succeeded` — verifies charge, creates standalone invoice via `StripeService.createAndFinalizeJobInvoice()`, emits `PaymentCompletedEvent`.
- `checkout.session.completed` (setup mode) — saves card via `handleSetupIntent()`.
- `checkout.session.completed` (subscription mode) — dispatches to `SUBSCRIPTION_WEBHOOKS` queue.
- `setup_intent.succeeded` — saves card.
- `charge.refunded` — syncs async refund status via `PaymentService.syncRefundStatus()`.
- `account.updated` — handled directly by `StripeService.handleAccountUpdatedEvent()`.
- `invoice.paid`, `invoice.payment_failed`, `customer.subscription.updated`, `customer.subscription.deleted` — dispatched to `SUBSCRIPTION_WEBHOOKS` BullMQ queue for async processing by `SubscriptionWebhookHandlerService` in the worker.

`SubscriptionWebhookHandlerService` owns subscription lifecycle processing: maps checkout sessions to selections, records per-cycle transactions, flips payment status on last cycle (with invoice fields), and schedules subscription cancellation at period end. For one-time invoices on `invoice.paid` (no subscription ID), it updates the existing payment's invoice fields.

## Known Gaps
1. `ProfileController.getMyReports` is currently not implemented and throws.
2. Explicit webhook idempotency (deduplication by Stripe event ID) is implemented for subscription events via `AuditLog` (`isWebhookProcessed` / `markWebhookProcessed`) but not for `payment_intent.succeeded`.
