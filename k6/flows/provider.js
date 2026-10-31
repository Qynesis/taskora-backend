/**
 * Provider user flows.
 * Covers: user sync, profile, browse job feed, submit bid, my bids,
 *         payment history, connect status, verification case.
 *
 * Required env vars:
 *   PROVIDER_TOKEN  — Supabase JWT (or any token when AUTH_BYPASS=true)
 */
import { sleep } from 'k6';
import { get, post, checkOk, checkStatus, parseJson } from '../helpers/http.js';

const token = () => __ENV.PROVIDER_TOKEN || 'test-provider-token';

export function syncProviderFlow() {
  const res = post('/users/sync', token(), { role: 'provider' });
  checkOk(res, 'provider-sync');
}

export function getProviderProfileFlow() {
  const res = get('/me', token());
  checkOk(res, 'provider-me');
}

export function getJobFeedFlow() {
  const res = get('/jobs/feed?page=1&limit=20', token());
  checkOk(res, 'job-feed');
}

export function getMyServicesFlow() {
  const res = get('/jobs/my-services?page=1&limit=20', token());
  checkOk(res, 'my-services');
}

export function getMyBidsFlow() {
  const res = get('/bids/my?page=1&limit=20', token());
  checkOk(res, 'my-bids');
}

export function getBidCountsFlow() {
  const res = get('/bids/my/counts', token());
  checkOk(res, 'bid-counts');
}

export function submitBidFlow(jobId) {
  if (!jobId) return;
  const res = post(`/jobs/${jobId}/bids`, token(), {
    price: 150,
    currency: 'AUD',
  });
  checkOk(res, 'submit-bid');
}

export function getConnectStatusFlow() {
  const res = get('/payments/connect/status', token());
  // 200 if connected, 404 or 422 if not yet onboarded — valid during load test
  checkStatus(res, 200, 'connect-status') || checkStatus(res, 404, 'connect-status-404');
}

export function getProviderPaymentListFlow() {
  const res = get('/payments/provider/list?page=1&limit=20', token());
  checkOk(res, 'provider-payments');
}

export function getProviderPaymentSummaryFlow() {
  const res = get('/payments/provider/summary', token());
  checkOk(res, 'provider-payment-summary');
}

export function getVerificationCaseFlow() {
  const res = get('/verification-docs/case', token());
  // 200 if case exists, 404 if not yet started
  checkStatus(res, 200, 'verification-case') || checkStatus(res, 404, 'verification-case-404');
}

export function getRefundRequestsFlow() {
  const res = get('/jobs/refund-requests?page=1&limit=20', token());
  checkOk(res, 'refund-requests');
}

export function providerReadOnlyFlow() {
  getProviderProfileFlow();
  sleep(0.3);
  getJobFeedFlow();
  sleep(0.3);
  getMyBidsFlow();
  sleep(0.3);
  getBidCountsFlow();
  sleep(0.3);
  getMyServicesFlow();
  sleep(0.3);
  getProviderPaymentSummaryFlow();
  sleep(1);
}

export function providerFullFlow() {
  syncProviderFlow();
  sleep(0.5);
  getProviderProfileFlow();
  sleep(0.3);
  getJobFeedFlow();
  sleep(0.3);
  getMyBidsFlow();
  sleep(0.3);
  getConnectStatusFlow();
  sleep(0.3);
  getProviderPaymentSummaryFlow();
  sleep(1);
}
