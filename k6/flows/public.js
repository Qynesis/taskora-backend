/**
 * Public-facing flows (no auth required).
 * Health check, category listing, job explore feed.
 */
import { sleep } from 'k6';
import { get, checkOk, parseJson } from '../helpers/http.js';

export function healthFlow() {
  const res = get('/health', null);
  checkOk(res, 'health-check');
}

export function categoriesFlow() {
  const res = get('/categories', null);
  checkOk(res, 'list-categories');
}

export function categoryNamesFlow() {
  const res = get('/categories/names', null);
  checkOk(res, 'category-names');
}

export function exploreJobsFlow() {
  const res = get('/jobs/explore?page=1&limit=20', null);
  checkOk(res, 'explore-jobs');
}

export function publicFlow() {
  healthFlow();
  sleep(0.5);
  categoriesFlow();
  sleep(0.5);
  exploreJobsFlow();
  sleep(1);
}
