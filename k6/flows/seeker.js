/**
 * Seeker user flows.
 * Covers: user sync, profile, post job, view jobs, bids on job, messaging.
 *
 * Required env vars:
 *   SEEKER_TOKEN  — Supabase JWT (or any token when AUTH_BYPASS=true)
 */
import { sleep } from 'k6';
import { get, post, patch, checkOk, checkStatus, parseJson } from '../helpers/http.js';

const token = () => __ENV.SEEKER_TOKEN || 'test-seeker-token';

export function syncSeekerFlow() {
  const res = post('/users/sync', token(), { role: 'seeker' });
  checkOk(res, 'seeker-sync');
}

export function getMyProfileFlow() {
  const res = get('/me', token());
  checkOk(res, 'seeker-me');
}

export function getNotificationSettingsFlow() {
  const res = get('/users/me/notification-settings', token());
  checkOk(res, 'notification-settings');
}

export function getNotificationsFlow() {
  const res = get('/notifications?page=1&limit=20', token());
  checkOk(res, 'list-notifications');
}

export function getMyJobsFlow() {
  const res = get('/jobs/my-requests?page=1&limit=20', token());
  checkOk(res, 'my-requests');
}

export function postJobFlow() {
  const res = post('/jobs', token(), {
    title: `k6 test job ${Date.now()}`,
    description: 'Automated k6 stress test job',
    type: 'bidding',
    engagement: 'single',
  });
  checkOk(res, 'post-job');
  const body = parseJson(res);
  return body?.data?.id ?? null;
}

export function getJobBidsFlow(jobId) {
  if (!jobId) return;
  const res = get(`/jobs/${jobId}/bids?page=1&limit=20`, token());
  checkOk(res, 'job-bids');
}

export function getPaymentCardsFlow() {
  const res = get('/payments/cards', token());
  checkOk(res, 'payment-cards');
}

export function getMyRequestPaymentsFlow() {
  const res = get('/jobs/my-request-payments?page=1&limit=20', token());
  checkOk(res, 'my-request-payments');
}

export function getBillingCustomerFlow() {
  const res = get('/billing/customer', token());
  // 200 if customer exists, 404 if not yet created — both valid for load testing
  checkStatus(res, 200, 'billing-customer') || checkStatus(res, 404, 'billing-customer-404');
}

export function getConversationsFlow() {
  const res = get('/conversations?page=1&limit=20', token());
  checkOk(res, 'conversations');
}

export function seekerReadOnlyFlow() {
  getMyProfileFlow();
  sleep(0.3);
  getMyJobsFlow();
  sleep(0.3);
  getNotificationsFlow();
  sleep(0.3);
  getPaymentCardsFlow();
  sleep(0.3);
  getConversationsFlow();
  sleep(1);
}

export function seekerFullFlow() {
  syncSeekerFlow();
  sleep(0.5);
  getMyProfileFlow();
  sleep(0.3);
  const jobId = postJobFlow();
  sleep(0.5);
  getMyJobsFlow();
  sleep(0.3);
  getJobBidsFlow(jobId);
  sleep(0.3);
  getPaymentCardsFlow();
  sleep(0.3);
  getConversationsFlow();
  sleep(1);
}
