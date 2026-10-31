# k6 Stress Test Suite

Performance and stress tests for the Service App API using [k6](https://k6.io).

## Prerequisites

Install k6:
```bash
# macOS
brew install k6

# Windows (via Chocolatey)
choco install k6

# Or download from https://k6.io/docs/get-started/installation/
```

## Test files

| File | Purpose | Duration |
|---|---|---|
| `smoke-test.js` | One pass through every critical path — confirm deployment is healthy | ~30 s |
| `load-test.js` | Simulates expected concurrent users within SLO thresholds | ~6 min |
| `stress-test.js` | Ramps past breaking point to find capacity limits | ~11 min |
| `spike-test.js` | Sudden traffic surge — tests burst handling and recovery | ~3 min |
| `soak-test.js` | Sustained load over 30 min — catches memory leaks and drift | 30+ min |

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `BASE_URL` | Yes | API base URL, e.g. `http://localhost:3000/api` |
| `SEEKER_TOKEN` | Recommended | JWT for a seeker user |
| `PROVIDER_TOKEN` | Recommended | JWT for a provider user |
| `ADMIN_TOKEN` | Optional | JWT for an admin user (admin flows only) |
| `SOAK_VUS` | Optional | VU count for soak test (default: `20`) |
| `DURATION_MIN` | Optional | Soak test duration in minutes (default: `30`) |

### Getting tokens for dev/staging

With `AUTH_BYPASS=true` set in your server env, the API accepts any well-formed JWT without Supabase validation. Generate a dummy one:

```bash
# Install jwt-cli if needed: npm install -g jwt-cli
# Or use https://jwt.io to craft a payload manually

# Example payload that most bypass strategies expect:
# { "sub": "<any-uuid>", "role": "seeker" }
```

Alternatively, call your Supabase project's `/auth/v1/token?grant_type=password` endpoint with a real test account and use the `access_token` from the response.

## Running tests

```bash
# Smoke test — always run this first
k6 run k6/smoke-test.js \
  -e BASE_URL=http://localhost:3000/api \
  -e SEEKER_TOKEN=<your-token> \
  -e PROVIDER_TOKEN=<your-token>

# Load test
k6 run k6/load-test.js \
  -e BASE_URL=http://localhost:3000/api \
  -e SEEKER_TOKEN=<your-token> \
  -e PROVIDER_TOKEN=<your-token>

# Stress test
k6 run k6/stress-test.js \
  -e BASE_URL=http://localhost:3000/api \
  -e SEEKER_TOKEN=<your-token> \
  -e PROVIDER_TOKEN=<your-token>

# Spike test
k6 run k6/spike-test.js \
  -e BASE_URL=http://localhost:3000/api \
  -e SEEKER_TOKEN=<your-token> \
  -e PROVIDER_TOKEN=<your-token>

# Soak test (30 min, staging only)
k6 run k6/soak-test.js \
  -e BASE_URL=https://staging.your-api.com/api \
  -e SEEKER_TOKEN=<your-token> \
  -e PROVIDER_TOKEN=<your-token>
```

## Viewing results

k6 prints a summary to the terminal. Key metrics to watch:

| Metric | What it means |
|---|---|
| `http_req_duration p(95)` | 95% of requests finish under this time |
| `http_req_duration p(99)` | Tail latency — outlier requests |
| `http_req_failed rate` | % of requests that returned a non-2xx response |
| `http_reqs` | Total request throughput |
| `vus_max` | Peak virtual users reached |

To export to a JSON file for later analysis:
```bash
k6 run k6/load-test.js --out json=results/load-$(date +%Y%m%d).json ...
```

To stream to Grafana Cloud k6 (free tier available):
```bash
k6 cloud k6/load-test.js ...
```

## SLO thresholds summary

These are encoded in each test file and will cause the test to exit with code 1 if breached.

| Test | p(95) target | error rate target |
|---|---|---|
| Smoke | < 3 s (lenient) | < 1% |
| Load | < 600 ms | < 1% |
| Stress | < 3 s (observe degradation) | < 10% |
| Spike | < 3 s | < 15% |
| Soak | < 600 ms | < 1% |

## Project layout

```
k6/
├── README.md
├── smoke-test.js       # Entry: smoke
├── load-test.js        # Entry: load
├── stress-test.js      # Entry: stress
├── spike-test.js       # Entry: spike
├── soak-test.js        # Entry: soak
├── helpers/
│   ├── http.js         # HTTP helpers (get, post, checkOk, …)
│   └── scenarios.js    # Reusable scenario / threshold builders
└── flows/
    ├── public.js       # Health check, categories, explore feed
    ├── seeker.js       # Seeker role flows
    ├── provider.js     # Provider role flows
    └── admin.js        # Admin role flows
```

## Interpreting stress test results

1. **Normal load (0–50 VU)**: p95 < 300 ms, error rate = 0% — this is the baseline.
2. **Degradation zone (50–150 VU)**: p95 starts climbing. Note the VU count where it crosses 1 s.
3. **Breaking point (150–300 VU)**: Error rate spikes, requests start timing out.
4. **Recovery**: Confirm latency returns to baseline after VU ramp-down. If it doesn't, you likely have a connection pool or memory issue.

Common root causes of early breaking:
- PostgreSQL `max_connections` too low (default is 100 — add a connection pooler like PgBouncer)
- Redis timeout under high queue pressure
- Missing DB indexes causing sequential scans (run `EXPLAIN ANALYZE` on slow queries)
- Node.js event loop blocking (no CPU-bound work should run in the main thread)
