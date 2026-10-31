/**
 * Soak Test
 * ---------
 * Runs at a moderate, realistic load for an extended period (30 minutes by default).
 * Purpose: catch memory leaks, connection pool exhaustion, gradual latency drift,
 *          and any time-based degradation that doesn't show up in short tests.
 *
 * Warning: this test takes 30+ minutes. Run it only in staging, not on local machines.
 *
 * Run:
 *   k6 run k6/soak-test.js \
 *     -e BASE_URL=https://staging.your-api.com/api \
 *     -e SEEKER_TOKEN=<token> \
 *     -e PROVIDER_TOKEN=<token> \
 *     -e DURATION_MIN=30
 *
 *   Override duration for a quick check:
 *   k6 run k6/soak-test.js -e DURATION_MIN=5 ...
 */
import { sleep } from 'k6';
import { publicFlow } from './flows/public.js';
import { seekerReadOnlyFlow } from './flows/seeker.js';
import { providerReadOnlyFlow } from './flows/provider.js';

const DURATION_MIN = parseInt(__ENV.DURATION_MIN || '30', 10);
const VUS = parseInt(__ENV.SOAK_VUS || '20', 10);

export const options = {
  scenarios: {
    soak: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: VUS },                          // ramp up
        { duration: `${DURATION_MIN - 4}m`, target: VUS },       // sustain
        { duration: '2m', target: 0 },                            // ramp down
      ],
      gracefulRampDown: '60s',
    },
  },
  thresholds: {
    // Soak test: same SLOs as load test — any drift above these is a memory/leak signal
    http_req_duration: ['p(95)<600', 'p(99)<1500'],
    http_req_failed: ['rate<0.01'],
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
