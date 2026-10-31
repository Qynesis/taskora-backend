/**
 * Admin user flows.
 * Covers: dashboard summary, provider list, seeker list, reports, audit logs.
 *
 * Required env vars:
 *   ADMIN_TOKEN  — Supabase JWT for an admin user
 */
import { sleep } from 'k6';
import { get, checkOk } from '../helpers/http.js';

const token = () => __ENV.ADMIN_TOKEN || 'test-admin-token';

export function getDashboardSummaryFlow() {
  const res = get('/admin/dashboard/summary', token());
  checkOk(res, 'admin-dashboard-summary');
}

export function getDashboardChartsFlow() {
  const res = get('/admin/dashboard/charts', token());
  checkOk(res, 'admin-dashboard-charts');
}

export function listProvidersFlow() {
  const res = get('/admin/providers?page=1&limit=20', token());
  checkOk(res, 'admin-providers');
}

export function listSeekersFlow() {
  const res = get('/admin/seekers?page=1&limit=20', token());
  checkOk(res, 'admin-seekers');
}

export function listReportsFlow() {
  const res = get('/admin/reports?page=1&limit=20', token());
  checkOk(res, 'admin-reports');
}

export function listAuditLogsFlow() {
  const res = get('/admin/audit-logs?page=1&limit=20', token());
  checkOk(res, 'admin-audit-logs');
}

export function listVerificationSubmissionsFlow() {
  const res = get('/admin/providers/verification-submissions?page=1&limit=20', token());
  checkOk(res, 'admin-verification-submissions');
}

export function adminReadOnlyFlow() {
  getDashboardSummaryFlow();
  sleep(0.5);
  listProvidersFlow();
  sleep(0.3);
  listSeekersFlow();
  sleep(0.3);
  listReportsFlow();
  sleep(0.3);
  listAuditLogsFlow();
  sleep(1);
}
