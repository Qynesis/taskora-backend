import { Processor } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Job } from 'bullmq';
import { QUEUE_NAMES, ProviderStatsJobPayload } from '@app/shared-types';
import { BaseProcessor } from './base.processor';

/**
 * Recomputes one provider's cached performance stats, off the queue.
 *
 * Full recompute from source, never a delta. That is the point: a delta must observe every
 * event to stay correct, so one missed or duplicated event corrupts the number permanently and
 * silently. Recomputing means a duplicate job is a no-op and a dropped job costs staleness
 * until the next event. The API's listener relies on this — it swallows enqueue failures
 * precisely because the next event repairs the row.
 *
 * Each aggregate is its own scalar subquery over a single table. That isolation is the fix:
 * these numbers used to be aggregated inline in ProfileService alongside the category, skill
 * and review joins, and the resulting cross product multiplied every rate by the size of the
 * other joins — a 96.4% job success rate was served as 964.3%.
 */
@Processor(QUEUE_NAMES.PROVIDER_STATS)
export class ProviderStatsProcessor extends BaseProcessor {
  protected readonly logger = new Logger(ProviderStatsProcessor.name);

  constructor(@InjectDataSource() private readonly dataSource: DataSource) {
    super();
  }

  async process(job: Job<ProviderStatsJobPayload>): Promise<void> {
    const { providerUserId, reason } = job.data;

    if (!providerUserId) {
      throw new Error(`Job ${job.id} has no providerUserId`);
    }

    await this.dataSource.query(
      `
      INSERT INTO "service"."provider_performance_stats" (
        provider_id, jobs_done, jobs_cancelled, rehired,
        job_success_rate, recommendation_rate, on_time_rate, on_budget_rate, computed_at
      )
      SELECT
        $1::uuid,
        COALESCE(j.done, 0),
        COALESCE(j.cancelled, 0),
        COALESCE(rh.rehired, 0),
        CASE WHEN COALESCE(j.done, 0) + COALESCE(j.cancelled, 0) = 0 THEN NULL
             ELSE ROUND(j.done::numeric / (j.done + j.cancelled) * 100, 1) END,
        CASE WHEN COALESCE(r.total, 0) = 0 THEN NULL
             ELSE ROUND(r.recommended::numeric / r.total * 100, 1) END,
        CASE WHEN COALESCE(r.total, 0) = 0 THEN NULL
             ELSE ROUND(r.on_time::numeric / r.total * 100, 1) END,
        CASE WHEN COALESCE(r.total, 0) = 0 THEN NULL
             ELSE ROUND(r.on_budget::numeric / r.total * 100, 1) END,
        now()
      FROM (SELECT 1) AS _
      LEFT JOIN (
        SELECT COUNT(*) FILTER (WHERE jb.status = 'completed') AS done,
               COUNT(*) FILTER (WHERE jb.status = 'cancelled') AS cancelled
        FROM "service"."selections" s
        JOIN "service"."jobs" jb ON jb.id = s.job_id
        WHERE s.provider_user_id = $1 AND jb.status IN ('completed', 'cancelled')
      ) j ON TRUE
      LEFT JOIN (
        SELECT COUNT(*) AS total,
               COUNT(*) FILTER (WHERE rv.rating >= 4) AS recommended,
               COUNT(*) FILTER (WHERE rv.delivered_on_time = true) AS on_time,
               COUNT(*) FILTER (WHERE rv.delivered_on_budget = true) AS on_budget
        FROM "service"."reviews" rv
        WHERE rv.provider_id = $1
      ) r ON TRUE
      LEFT JOIN (
        SELECT COUNT(*) AS rehired
        FROM "service"."selections" rs
        JOIN "service"."jobs" rj ON rj.id = rs.job_id AND rj.status = 'completed'
        WHERE rs.provider_user_id = $1
          AND EXISTS (
            SELECT 1 FROM "service"."selections" prev
            JOIN "service"."jobs" prevj ON prevj.id = prev.job_id AND prevj.status = 'completed'
            WHERE prev.provider_user_id = $1
              AND prev.selected_by_user_id = rs.selected_by_user_id
              AND prevj.created_at < rj.created_at
          )
      ) rh ON TRUE
      ON CONFLICT (provider_id) DO UPDATE SET
        jobs_done           = EXCLUDED.jobs_done,
        jobs_cancelled      = EXCLUDED.jobs_cancelled,
        rehired             = EXCLUDED.rehired,
        job_success_rate    = EXCLUDED.job_success_rate,
        recommendation_rate = EXCLUDED.recommendation_rate,
        on_time_rate        = EXCLUDED.on_time_rate,
        on_budget_rate      = EXCLUDED.on_budget_rate,
        computed_at         = EXCLUDED.computed_at
      `,
      [providerUserId],
    );

    this.logger.log(
      `Recomputed stats for provider ${providerUserId}${reason ? ` (${reason})` : ''}`,
    );
  }
}
