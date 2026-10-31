# Flow Spec: Conversation and Messaging

## Goal
Specify communication behavior between seekers and providers across inbox and message history APIs.

## Conversation Start
1. Sender targets a recipient and sends initial body.
2. Service validates both users and derives canonical seeker-provider pair.
3. Conversation is fetched or created for that pair.
4. First direct message is persisted.

## Message Send
1. Sender posts message to existing conversation.
2. Participation check ensures sender belongs to that conversation.
3. Message moderation validation runs before persistence.
4. Message persisted, response DTO built, and event emitted to notify recipient.

## Read Model
1. Inbox endpoint returns ordered conversations with:
- last message preview
- unread count
- participant summary
2. Message list endpoint returns full timeline with sender enrichment.
3. Mark-read endpoint updates unread messages where sender is not current user.

## Invariants
1. One conversation per seeker-provider pair.
2. Non-participants cannot read or write conversation content.
3. Unread state is tracked per message row via `is_read`.

## Related Tables
- `conversations`
- `direct_messages`
