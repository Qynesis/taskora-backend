# Flow Spec: Job Lifecycle

## Goal
Define the canonical state progression for a seeker-posted bidding job and explain how related entities are populated.

## Canonical Status Rail
`POSTED -> BIDDING -> SELECTED -> IN_PROGRESS -> COMPLETED`

Terminal exits:
- `CANCELLED`
- `REJECTED` (for direct flow compatibility)

## Narrative
1. Job creation
- Seeker creates a job with service duration and optional photos.
- Service derives compatibility fields: engagement and duration months.
- Initial status defaults to `POSTED`.

2. Bidding phase
- Providers submit bids.
- Job feed and seeker views aggregate bid count and top bid pricing.

3. Selection phase
- Seeker selects a provider/bid.
- `selections` record enforces one winner per job.
- Job transitions to `SELECTED`.

4. Execution phase
- Status updates to `IN_PROGRESS` and later `COMPLETED` (or `CANCELLED`).
- Event emission occurs for notable status changes.

## Data Effects
- `jobs`: source of truth for lifecycle state.
- `bids`: many bids per job.
- `selections`: one row per job after winner chosen.
- `job_contracts` + `subscriptions`: created once long-duration contract terms are submitted.

## Observability Hooks
- Domain events: `JobCreatedEvent`, `JobStatusChangedEvent`, `JobRefundRequestedEvent`, `RefundRejectedEvent`.
- `JobStatusChangedEvent` carries an `initiatedBy` field (`'seeker' | 'provider' | 'system'`). The notification handler skips notifying the initiator — so when a provider marks the job `in_progress` or `completed`, only the seeker is notified; when a seeker cancels, only the provider is notified.
- API status rail helper computes client-friendly step state (`completed/active/upcoming`).

## Edge Cases
1. Job edit is only allowed while status is `POSTED` or `BIDDING`.
2. Single-task jobs do not require contract terms.
