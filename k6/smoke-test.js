/**
 * Smoke Test
 * ----------
 * Single VU, runs once through every critical path.
 * Purpose: verify the deployment is up before committing to a full load run.
 *
 * Run:
 *   k6 run k6/smoke-test.js \
 *     -e BASE_URL=http://localhost:3000/api \
 *     -e SEEKER_TOKEN=<token> \
 *     -e PROVIDER_TOKEN=<token> \
 *     -e ADMIN_TOKEN=<token>
 */
import { sleep } from 'k6';
import { check } from 'k6';
import { get, post, checkOk, parseJson } from './helpers/http.js';
import { publicFlow } from './flows/public.js';
import { seekerFullFlow, getMyJobsFlow } from './flows/seeker.js';
import { providerFullFlow } from './flows/provider.js';
import { adminReadOnlyFlow } from './flows/admin.js';

export const options = {
  vus: 1,
  iterations: 1,
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<3000'],
  },
};

export default function () {
  // 1. Public endpoints — no auth
  publicFlow();
  sleep(0.5);

  // 2. Seeker flow — create job, list bids, notifications
  if (__ENV.SEEKER_TOKEN) {
    seekerFullFlow();
    sleep(0.5);
  }

  // 3. Provider flow — browse feed, check payments
  if (__ENV.PROVIDER_TOKEN) {
    providerFullFlow();
    sleep(0.5);
  }

  // 4. Admin flow — dashboard, user lists
  if (__ENV.ADMIN_TOKEN) {
    adminReadOnlyFlow();
  }
}
