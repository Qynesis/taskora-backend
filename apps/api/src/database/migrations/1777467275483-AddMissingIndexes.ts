import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMissingIndexes1777467275483 implements MigrationInterface {
  name = 'AddMissingIndexes1777467275483';
  transaction = false; // CONCURRENTLY cannot run inside a transaction block

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── jobs ──────────────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "IDX_jobs_seeker_user_id"
        ON "service"."jobs" ("seeker_user_id")
    `);
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "IDX_jobs_provider_user_id"
        ON "service"."jobs" ("provider_user_id")
    `);
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "IDX_jobs_category_id"
        ON "service"."jobs" ("category_id")
    `);
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "IDX_jobs_selected_provider_id"
        ON "service"."jobs" ("selected_provider_id")
    `);
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "IDX_jobs_seeker_user_id_status"
        ON "service"."jobs" ("seeker_user_id", "status")
    `);
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "IDX_jobs_status_created_at"
        ON "service"."jobs" ("status", "created_at")
    `);

    // ── bids ──────────────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "IDX_bids_status"
        ON "service"."bids" ("status")
    `);
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "IDX_bids_job_id_status"
        ON "service"."bids" ("job_id", "status")
    `);

    // ── payments ──────────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "IDX_payments_status"
        ON "service"."payments" ("status")
    `);

    // ── notifications ─────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "IDX_notifications_user_id_read_at"
        ON "service"."notifications" ("user_id", "read_at")
    `);
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "IDX_notifications_user_id_created_at"
        ON "service"."notifications" ("user_id", "created_at")
    `);

    // ── subscriptions ─────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "IDX_subscriptions_seeker_user_id"
        ON "service"."subscriptions" ("seeker_user_id")
    `);
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "IDX_subscriptions_provider_user_id"
        ON "service"."subscriptions" ("provider_user_id")
    `);
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "IDX_subscriptions_status"
        ON "service"."subscriptions" ("status")
    `);

    // ── conversations ─────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "IDX_conversations_seeker_id_provider_id"
        ON "service"."conversations" ("seeker_id", "provider_id")
    `);

    // ── selections ────────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "IDX_selections_bid_id"
        ON "service"."selections" ("bid_id")
    `);
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "IDX_selections_provider_user_id"
        ON "service"."selections" ("provider_user_id")
    `);
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "IDX_selections_selected_by_user_id"
        ON "service"."selections" ("selected_by_user_id")
    `);

    // ── subscription_periods ──────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "IDX_subscription_periods_payment_status"
        ON "service"."subscription_periods" ("payment_status")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX CONCURRENTLY IF EXISTS "service"."IDX_subscription_periods_payment_status"`);
    await queryRunner.query(`DROP INDEX CONCURRENTLY IF EXISTS "service"."IDX_selections_selected_by_user_id"`);
    await queryRunner.query(`DROP INDEX CONCURRENTLY IF EXISTS "service"."IDX_selections_provider_user_id"`);
    await queryRunner.query(`DROP INDEX CONCURRENTLY IF EXISTS "service"."IDX_selections_bid_id"`);
    await queryRunner.query(`DROP INDEX CONCURRENTLY IF EXISTS "service"."IDX_conversations_seeker_id_provider_id"`);
    await queryRunner.query(`DROP INDEX CONCURRENTLY IF EXISTS "service"."IDX_subscriptions_status"`);
    await queryRunner.query(`DROP INDEX CONCURRENTLY IF EXISTS "service"."IDX_subscriptions_provider_user_id"`);
    await queryRunner.query(`DROP INDEX CONCURRENTLY IF EXISTS "service"."IDX_subscriptions_seeker_user_id"`);
    await queryRunner.query(`DROP INDEX CONCURRENTLY IF EXISTS "service"."IDX_notifications_user_id_created_at"`);
    await queryRunner.query(`DROP INDEX CONCURRENTLY IF EXISTS "service"."IDX_notifications_user_id_read_at"`);
    await queryRunner.query(`DROP INDEX CONCURRENTLY IF EXISTS "service"."IDX_payments_status"`);
    await queryRunner.query(`DROP INDEX CONCURRENTLY IF EXISTS "service"."IDX_bids_job_id_status"`);
    await queryRunner.query(`DROP INDEX CONCURRENTLY IF EXISTS "service"."IDX_bids_status"`);
    await queryRunner.query(`DROP INDEX CONCURRENTLY IF EXISTS "service"."IDX_jobs_status_created_at"`);
    await queryRunner.query(`DROP INDEX CONCURRENTLY IF EXISTS "service"."IDX_jobs_seeker_user_id_status"`);
    await queryRunner.query(`DROP INDEX CONCURRENTLY IF EXISTS "service"."IDX_jobs_selected_provider_id"`);
    await queryRunner.query(`DROP INDEX CONCURRENTLY IF EXISTS "service"."IDX_jobs_category_id"`);
    await queryRunner.query(`DROP INDEX CONCURRENTLY IF EXISTS "service"."IDX_jobs_provider_user_id"`);
    await queryRunner.query(`DROP INDEX CONCURRENTLY IF EXISTS "service"."IDX_jobs_seeker_user_id"`);
  }
}
