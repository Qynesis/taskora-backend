export enum ProviderStatsJobName {
  RECOMPUTE = 'provider-stats.recompute',
}

/**
 * Recompute one provider's cached performance stats from source.
 *
 * Deliberately carries only the id: the job recomputes from the database rather than applying
 * a delta, so it is idempotent and self-healing. A duplicate job is a no-op, and a job that is
 * dropped costs staleness until the next event rather than permanent drift.
 */
export interface ProviderStatsJobPayload {
  /** users.id of the provider (not the profile id). */
  providerUserId: string;
  /** What triggered this, for logs only. */
  reason?: string;
}
