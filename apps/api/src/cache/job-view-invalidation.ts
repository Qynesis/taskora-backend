import { InvalidateCacheKey } from './decorators/invalidate-cache.decorator';

type Extractor = (req: any, res: any) => string | undefined;

/**
 * Central job-view cache invalidation.
 *
 * Any action that creates or changes a job — post, edit, delete, cancel, bid, select, pay,
 * refund, status change — MUST clear every one of these keys, otherwise a provider's Feed /
 * My Services or a seeker's My Requests / My Payments (or the shared job detail) is left
 * showing stale data and the user thinks the app is broken.
 *
 * Discovery keys (`explore`, `feed`, `my-services-counts`) are cleared with a broad wildcard
 * because a single job surfaces in many different users' lists — there is no way to know which
 * ones without recomputing matches, so we clear them all. The 60s TTL keeps them small.
 *
 * The same set is applied at the service layer (Stripe webhooks) via AppCacheService — see
 * `JOB_VIEW_PREFIXES` — where the @InvalidateCache interceptor cannot run.
 */
export function invalidateJobViews(jobId: Extractor, seekerId: Extractor): InvalidateCacheKey[] {
  return [
    'jobs:explore:*',
    'jobs:feed:*',
    'jobs:my-services-counts:*',
    (req, res) => `jobs:detail:${jobId(req, res)}:*`,
    (req, res) => `jobs:bids:${jobId(req, res)}:*`,
    (req, res) => `jobs:contract:${jobId(req, res)}`,
    (req, res) => `jobs:my-requests:${seekerId(req, res)}:*`,
    (req, res) => `jobs:my-requests-counts:${seekerId(req, res)}`,
    (req, res) => `jobs:my-request-payments-counts:${seekerId(req, res)}`,
  ];
}

/**
 * Service-layer equivalent of {@link invalidateJobViews}, for code paths outside the request
 * cycle (Stripe webhooks). Pass the resolved job id and seeker id; every returned string is a
 * prefix to hand to `AppCacheService.delByPrefix`.
 */
export function jobViewPrefixes(jobId: string, seekerId: string): string[] {
  return [
    'jobs:explore:',
    'jobs:feed:',
    'jobs:my-services-counts:',
    `jobs:detail:${jobId}:`,
    `jobs:bids:${jobId}:`,
    `jobs:contract:${jobId}`,
    `jobs:my-requests:${seekerId}:`,
    `jobs:my-requests-counts:${seekerId}`,
    `jobs:my-request-payments-counts:${seekerId}`,
  ];
}
