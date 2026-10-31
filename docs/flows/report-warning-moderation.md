# Flow Spec: Reporting and Warning Moderation

## Goal
Define misconduct reporting and admin moderation workflow through warning issuance and thread-based follow-up.

## Reporting Flow
1. User reports another user with kind + description + attachments.
2. Service creates `user_reports` row with generated `reportRef` and initial `pending` status.
3. `ReportCreatedEvent` is emitted for audit logging.
4. When admin resolves or dismisses a report, `ReportStatusChangedEvent` is emitted — the **reporter** is notified ("Report resolved" or "Report dismissed").

## Admin Moderation Paths
1. Update status path:
- admin can set report status
- dismiss requires reason
- resolved sets `resolvedAt`
2. Warning path:
- allowed only for `pending` reports
- sets status to `warning_sent`
- sets warning text, warned timestamp, suspension deadline
- creates `user_warnings` row
- creates warning thread + first admin message

## Warning Thread Behavior
1. Recipient can reply while thread is open.
2. Admin can continue thread conversation.
3. When admin sends a thread message, `WarningMessageCreatedEvent` is emitted — the **recipient user** is push-notified ("New warning message"). User replies do not trigger push (admin has no FCM token).
4. Closed threads block further replies.
5. Thread closure can be triggered by report resolution flow.

## Status Anchors
- Report statuses: `pending`, `warning_sent`, `resolved`, `dismissed`.
- Warning sender type: `admin` or `user`.

## Compliance Notes
1. Warning flow currently computes suspension deadline at warning time.
2. Audit linkage should remain explicit for admin actions.
