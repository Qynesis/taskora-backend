# Flow Spec: Direct Booking

## Goal
Document direct bookings where seeker targets a specific provider without competitive bidding.

## Flow
1. Seeker creates a booking payload with provider ID, service description, category, schedule fields, and optional photos.
2. Service creates a `jobs` row with `type=direct` and initial status `pending`.
3. Optional photos are persisted in the same transaction.
4. `BookingCreatedEvent` is emitted — **only the provider** is notified ("New booking request"). The seeker initiated the action and already has the API response.

## Provider Status Transitions
1. Provider can transition the booking from `pending` to other statuses (e.g. `in_progress`, `completed`, `rejected`).
2. `BookingStatusChangedEvent` is emitted — **seeker** is notified of the new status.

## Cancellation
1. Seeker can cancel own booking only while status is `pending`.
2. Cancellation transitions status to `cancelled`.
3. `BookingStatusChangedEvent` is emitted — **provider** is notified ("Booking cancelled").

## Invariants
- `jobs.type` is the discriminator between direct booking and bidding flows.
- Access checks are role-bound by ownership (`seeker_user_id` or `provider_user_id`).
