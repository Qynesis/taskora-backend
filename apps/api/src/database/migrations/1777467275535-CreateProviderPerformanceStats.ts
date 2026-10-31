import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateProviderPerformanceStats1777467275535 implements MigrationInterface {
  name = 'CreateProviderPerformanceStats1777467275535';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Cached provider performance metrics, recomputed off the PROVIDER_STATS queue.
    //
    // These were previously computed inline in ProfileService on every request, in the same
    // query that fetches categories, skills and reviews. That cross product repeated each job
    // row once per (category x skill x review), which is how a 96.4% job success rate was
    // reported as 964.3%. Computing them in isolation removes the fan-out entirely, and doing
    // it once per event rather than once per request removes the cost.
    //
    // Kept separate from provider_rating_summaries deliberately: that table is maintained by
    // an incremental ON CONFLICT delta in ReviewService, whereas every column here is a full
    // recompute from source. Mixing the two maintenance models in one table would make it
    // impossible to reason about which columns can drift.
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "service"."provider_performance_stats" (
        "provider_id"         uuid        PRIMARY KEY,
        "jobs_done"           int         NOT NULL DEFAULT 0,
        "jobs_cancelled"      int         NOT NULL DEFAULT 0,
        "rehired"             int         NOT NULL DEFAULT 0,
        "job_success_rate"    numeric(4,1),
        "recommendation_rate" numeric(4,1),
        "on_time_rate"        numeric(4,1),
        "on_budget_rate"      numeric(4,1),
        "computed_at"         timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "FK_provider_performance_stats_user"
          FOREIGN KEY ("provider_id") REFERENCES "service"."users" ("id") ON DELETE CASCADE
      )
    `);

    // The rate columns are nullable on purpose: null means "no terminal jobs yet" / "no reviews
    // yet", which is different from 0% and is what the DTOs already document. numeric(4,1)
    // holds 0.0-100.0; the old inline SQL could exceed 100 and would have overflowed this.

    // Backfill in one pass so the table is usable the moment it exists rather than filling in
    // lazily as events trickle through. Each aggregate is computed in its own scalar subquery
    // against a single table, so there is no join fan-out to guard against here.
    await queryRunner.query(`
      INSERT INTO "service"."provider_performance_stats" (
        provider_id, jobs_done, jobs_cancelled, rehired,
        job_success_rate, recommendation_rate, on_time_rate, on_budget_rate, computed_at
      )
      SELECT
        u.id,
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
      FROM "service"."users" u
      LEFT JOIN (
        SELECT s.provider_user_id AS pid,
               COUNT(*) FILTER (WHERE jb.status = 'completed') AS done,
               COUNT(*) FILTER (WHERE jb.status = 'cancelled') AS cancelled
        FROM "service"."selections" s
        JOIN "service"."jobs" jb ON jb.id = s.job_id
        WHERE jb.status IN ('completed', 'cancelled')
        GROUP BY s.provider_user_id
      ) j ON j.pid = u.id
      LEFT JOIN (
        SELECT rv.provider_id AS pid,
               COUNT(*) AS total,
               COUNT(*) FILTER (WHERE rv.rating >= 4) AS recommended,
               COUNT(*) FILTER (WHERE rv.delivered_on_time = true) AS on_time,
               COUNT(*) FILTER (WHERE rv.delivered_on_budget = true) AS on_budget
        FROM "service"."reviews" rv
        GROUP BY rv.provider_id
      ) r ON r.pid = u.id
      LEFT JOIN (
        SELECT rs.provider_user_id AS pid, COUNT(*) AS rehired
        FROM "service"."selections" rs
        JOIN "service"."jobs" rj ON rj.id = rs.job_id AND rj.status = 'completed'
        WHERE EXISTS (
          SELECT 1 FROM "service"."selections" prev
          JOIN "service"."jobs" prevj ON prevj.id = prev.job_id AND prevj.status = 'completed'
          WHERE prev.provider_user_id = rs.provider_user_id
            AND prev.selected_by_user_id = rs.selected_by_user_id
            AND prevj.created_at < rj.created_at
        )
        GROUP BY rs.provider_user_id
      ) rh ON rh.pid = u.id
      WHERE u.role = 'provider'
      ON CONFLICT (provider_id) DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "service"."provider_performance_stats"`);
  }
}
