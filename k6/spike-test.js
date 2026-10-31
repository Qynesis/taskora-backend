/**
 * Spike Test
 * ----------
 * Simulates a sudden traffic spike — e.g., a marketing campaign or viral moment.
 * Ramps from 0 to 300 VU in 30 seconds, holds for 1 minute, drops back to 0.
 *
 * What to watch:
 *   - Does the API return errors during the spike onset?
 *   - How quickly does latency recover once the spike drops?
 *   - Do any requests queue (long p99 tail even after p95 recovers)?
 *
 * Run:
 *   k6 run k6/spike-test.js \
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
    spike: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '10s', target: 10 },   // baseline — confirm it's working
        { duration: '30s', target: 300 },  // spike: 0 → 300 VU in 30 s
        { duration: '1m', target: 300 },   // hold at peak
        { duration: '30s', target: 10 },   // drop back to baseline
        { duration: '30s', target: 0 },    // recover
      ],
      gracefulRampDown: '30s',
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<3000'],
    http_req_failed: ['rate<0.15'],  // spikes may cause transient errors
  },
};

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
