/**
 * Load Test
 * ---------
 * Simulates expected production traffic across seeker, provider, and public roles.
 * Target: verify the system handles normal concurrent load within SLO thresholds.
 *
 * Traffic distribution (mirrors typical usage):
 *   50% seeker read-heavy (browsing, payments, notifications)
 *   35% provider read-heavy (job feed, bids, earnings)
 *   15% public (categories, explore feed)
 *
 * Run:
 *   k6 run k6/load-test.js \
 *     -e BASE_URL=http://localhost:3000/api \
 *     -e SEEKER_TOKEN=<token> \
 *     -e PROVIDER_TOKEN=<token>
 *
 * Expected scale: 50 concurrent users, ~5 min sustained.
 */
import { sleep } from 'k6';
import { publicFlow } from './flows/public.js';
import { seekerReadOnlyFlow } from './flows/seeker.js';
import { providerReadOnlyFlow } from './flows/provider.js';

export const options = {
  scenarios: {
    seeker_load: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '1m', target: 25 },   // ramp to 25 VU over 1 min
        { duration: '4m', target: 25 },   // hold for 4 min
        { duration: '1m', target: 0 },    // ramp down
      ],
      gracefulRampDown: '30s',
      exec: 'seekerScenario',
    },
    provider_load: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '1m', target: 17 },
        { duration: '4m', target: 17 },
        { duration: '1m', target: 0 },
      ],
      gracefulRampDown: '30s',
      exec: 'providerScenario',
    },
    public_load: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '1m', target: 8 },
        { duration: '4m', target: 8 },
        { duration: '1m', target: 0 },
      ],
      gracefulRampDown: '30s',
      exec: 'publicScenario',
    },
  },
  thresholds: {
    // Overall — 99th percentile across all requests
    http_req_duration: ['p(95)<600', 'p(99)<1500'],
    http_req_failed: ['rate<0.01'],

    // Per-scenario tagged metrics
    'http_req_duration{scenario:seeker_load}': ['p(95)<600'],
    'http_req_duration{scenario:provider_load}': ['p(95)<600'],
    'http_req_duration{scenario:public_load}': ['p(95)<300'],
  },
};

export function seekerScenario() {
  seekerReadOnlyFlow();
}

export function providerScenario() {
  providerReadOnlyFlow();
}

export function publicScenario() {
  publicFlow();
}

// Default function is unused when scenarios define exec — required for k6 to compile
export default function () {}
