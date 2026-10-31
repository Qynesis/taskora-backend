/**
 * Stress Test
 * -----------
 * Ramps VUs well beyond expected load to find the breaking point.
 * Purpose: discover at what concurrency the API starts failing or slowing down.
 *
 * Stages:
 *   0 → 50 VU  (2 min)  — baseline, should be well within capacity
 *   50 → 100 VU (2 min) — moderate stress
 *   100 → 200 VU (3 min) — heavy stress
 *   200 → 300 VU (2 min) — beyond expected peak
 *   300 → 0 VU  (2 min)  — recovery
 *
 * What to watch:
 *   - At which VU count does p95 latency start climbing past 1s?
 *   - At which VU count does the error rate exceed 1%?
 *   - Does the system recover after ramp-down? (check CPU + DB connections)
 *
 * Run:
 *   k6 run k6/stress-test.js \
 *     -e BASE_URL=http://localhost:3000/api \
 *     -e SEEKER_TOKEN=<token> \
 *     -e PROVIDER_TOKEN=<token>
 */
import { sleep } from 'k6';
import { publicFlow } from './flows/public.js';
import { seekerReadOnlyFlow } from './flows/seeker.js';
import { providerReadOnlyFlow } from './flows/provider.js';

export const options = {
  scenarios: {
    stress: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 50 },   // warm up
        { duration: '2m', target: 100 },  // moderate stress
        { duration: '3m', target: 200 },  // heavy stress
        { duration: '2m', target: 300 },  // beyond expected peak
        { duration: '2m', target: 0 },    // recovery
      ],
      gracefulRampDown: '30s',
    },
  },
  thresholds: {
    // Thresholds are intentionally lenient for stress tests;
    // the goal is to observe degradation, not pass/fail on strict SLOs.
    http_req_duration: ['p(95)<3000'],
    http_req_failed: ['rate<0.10'],  // alert if >10% of requests error
  },
};

// Mix of request types to simulate realistic stress
export default function () {
  const roll = Math.random();
  if (roll < 0.5) {
    seekerReadOnlyFlow();
  } else if (roll < 0.85) {
    providerReadOnlyFlow();
  } else {
    publicFlow();
  }
}
