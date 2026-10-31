# Deployment Guide

## Overview

Production runs on an **Azure VM** (Ubuntu). The API and worker are deployed as Docker containers behind an **Nginx** reverse proxy. PostgreSQL and Redis run as managed services or additional containers on the same VM.

```
Internet → Nginx (port 80/443) → Docker network (backend) → service-api (port 3000)
                                                           → service-worker (port 3001)
```

---

## Infrastructure

| Component | Where |
|---|---|
| API container | `service-api` (Docker, port 3000 internal) |
| Worker container | `service-worker` (Docker, port 3001 internal) |
| PostgreSQL | Azure-managed or VM-local |
| Redis | VM-local or managed |
| Nginx | VM-level, reverse proxy to Docker network |
| Blob Storage | Azure Blob Storage (separate resource) |
| Docker network | `backend` — external, pre-created on VM |

---

## Prerequisites on the VM

```bash
# Create the shared Docker network (once, on fresh VM)
docker network create backend

# Ensure .env exists at ~/app/service-app-aus-client/.env
```

---

## First Deployment (Fresh VM)

```bash
# 1. SSH into the VM
ssh azureuser@<server-ip>

# 2. Clone the repo
cd ~/app
git clone <repo-url> service-app-aus-client
cd service-app-aus-client

# 3. Create .env from template
cp .env.example .env
nano .env    # fill all required values (see docs/environment-variables.md)
# Ensure: NODE_ENV=production, AUTH_BYPASS=false

# 4. Create the Docker network if it doesn't exist
docker network create backend

# 5. Build and start
docker compose build
docker compose up -d

# 6. Run migrations from your local machine via SSH tunnel (see docs/local-development.md)
# On your LOCAL machine:
ssh -L 5432:<remote-db-host>:5432 azureuser@<server-ip> -N
# Then:
node scripts/db-setup.mjs migrate seed
```

---

## Deploying an Update

```bash
# On the VM
cd ~/app/service-app-aus-client

# 1. Pull latest code
git pull

# 2. Rebuild images
docker compose build

# 3. Restart containers (zero-downtime: restart one at a time if needed)
docker compose up -d --no-deps api
docker compose up -d --no-deps worker

# 4. Run any new migrations from your local machine
# (via SSH tunnel as above)
node scripts/db-setup.mjs migrate
```

---

## docker-compose.yml Summary

```yaml
services:
  api:
    build target: api
    port: 3000 (internal)
    env_file: .env
    overrides: NODE_ENV=production, DB_HOST=postgres, REDIS_HOST=redis
    healthcheck: GET /api/health

  worker:
    build target: worker
    port: 3001 (internal)
    env_file: .env
    overrides: NODE_ENV=production, DB_HOST=postgres, REDIS_HOST=redis

networks:
  backend: external (pre-created)
```

The `backend` network is external — it must be created manually on the VM before `docker compose up`. This allows Nginx (running outside Docker) to route to containers by name.

---

## Dockerfile Stages

The multi-stage Dockerfile produces two independent images from one build context:

| Stage | Purpose | Output |
|---|---|---|
| `deps` | Install all dependencies | `node_modules/` |
| `builder` | Compile TypeScript | `dist/` |
| `api` | Production API image | Runs `dist/apps/api/main.js` |
| `worker` | Production worker image | Runs `dist/apps/worker/main.js` |

Build a specific target:
```bash
docker build --target api -t service-api .
docker build --target worker -t service-worker .
```

---

## Nginx Configuration (example)

```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://service-api:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Request-Id $request_id;

        # Required for Stripe webhook signature verification
        proxy_request_buffering on;
    }
}
```

> The webhook endpoint (`POST /api/webhook/stripe`) requires the **raw request body** to be forwarded unchanged for Stripe signature verification. Do not enable body rewriting for this path.

---

## Environment File on the VM

The `.env` file on the VM **must** have:

```env
NODE_ENV=production
AUTH_BYPASS=false
DB_HOST=postgres         # Docker service name
REDIS_HOST=redis         # Docker service name
AZURE_STORAGE_CONNECTION_STRING=<full connection string>
STRIPE_SEC_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
SUPABASE_URL=https://...
SUPABASE_ANON_KEY=...
```

> The connection string truncation bug (showing `blob.co>` instead of `blob.core.windows.net`) has caused container crashes before. Always paste the full connection string and verify it after saving.

---

## Logs and Monitoring

```bash
# Tail API logs
docker logs service-api -f

# Tail worker logs
docker logs service-worker -f

# Check container health
docker ps

# Restart a container
docker restart service-api
```

---

## Stripe Webhook Registration

Only **one** endpoint is registered with Stripe:

```
POST https://api.yourdomain.com/api/webhook/stripe
```

All event types are handled by this single endpoint. Do not register `/api/webhooks/stripe` (note the 's') — that path no longer exists.

Events to enable in the Stripe dashboard:
- `payment_intent.succeeded`
- `charge.refunded`
- `checkout.session.completed`
- `setup_intent.succeeded`
- `invoice.paid`
- `invoice.payment_failed`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `account.updated`
