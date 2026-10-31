# Flow Spec: Support Tickets and Replies

## Goal
Describe help-desk flow where users open support tickets and admins reply in-thread.

## Ticket Creation
1. User submits subject + body (+ optional attachments).
2. Service creates ticket row and first message row.
3. Ticket-created event is emitted.

## Messaging
1. User reply path validates requester owns the ticket.
2. Admin reply path posts as admin sender type.
3. Each reply emits support-message-created event for notification fan-out.

## Query Surfaces
1. User ticket list: filtered to sender-owned tickets.
2. Admin ticket list: all tickets.
3. Message history: chronological per ticket.
4. Ticket metadata endpoint: subject, sender display info, creation timestamp.

## Invariants
1. Ticket ownership check is enforced for user reads/replies.
2. Message rows include `senderType` for UI rendering.

## Related Tables
- `support_tickets`
- `support_messages`
