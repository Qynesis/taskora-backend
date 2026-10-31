# Data Flow Diagram (Level 1)

This DFD shows how data moves across clients, API, storage, queueing, worker, and external systems.

```mermaid
flowchart LR
  Seeker([Seeker App])
  Provider([Provider App])
  Admin([Admin Console])

  API[[API Application]]
  Worker[[Worker Application]]
  Queue[(BullMQ/Redis Queue)]
  Cache[(Redis Cache)]
  DB[(PostgreSQL Service Schema)]
  Blob[(Azure Blob Storage)]
  Stripe[(Stripe)]
  Supabase[(Supabase Auth)]
  FCM[(Firebase Cloud Messaging)]

  Seeker -->|HTTP API Requests| API
  Provider -->|HTTP API Requests| API
  Admin -->|HTTP API Requests| API

  API -->|Token validation| Supabase
  API -->|Read/Write domain data| DB
  API -->|Read/Write cache| Cache
  API -->|Enqueue async jobs| Queue
  API -->|Generate upload/read SAS URLs| Blob
  API -->|Create payments and verify webhooks| Stripe
  API -->|Persist + trigger notifications| FCM

  Queue -->|Consume jobs| Worker
  Worker -->|Async updates/events| DB
  Worker -->|Notification/report/email side effects| FCM

  Stripe -->|Webhook events| API
```

## Primary Data Stores
- PostgreSQL: source of truth for transactional domain data.
- Redis cache: fast read path for frequently requested resources.
- Redis queue: BullMQ job state and dispatch.
- Azure Blob: large file objects and evidence media.

## Primary Data Flows
1. Request/response flow: client -> API -> DB/cache -> client.
2. Async flow: API -> queue -> worker -> side effects/data updates.
3. File flow: API issues SAS URL -> client uploads directly to Blob -> API stores Blob URL metadata.
4. Payment flow: API creates payment intent -> Stripe callback webhook -> API persists payment result.
