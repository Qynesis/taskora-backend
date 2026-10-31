import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Drops the unused `job_cancellations` table. The entity was never injected, queried, or related to.
 * Seeker job cancellation (JobService.cancelJobBySeeker) records its outcome on `jobs` (status →
 * CANCELLED), `refunds`, and `payments` (status → REFUNDED) — never on this table.
 */
export class DropJobCancellations1777467275540 implements MigrationInterface {
  name = 'DropJobCancellations1777467275540';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "service"."job_cancellations"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Recreates the table structure only (data is not recoverable), matching the original schema.
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "service"."job_cancellations" (
        "id"                   uuid         PRIMARY KEY DEFAULT uuid_generate_v4(),
        "created_at"           timestamptz  NOT NULL DEFAULT now(),
        "updated_at"           timestamptz  NOT NULL DEFAULT now(),
        "deleted_at"           timestamptz,
        "job_id"               uuid         NOT NULL UNIQUE REFERENCES "service"."jobs"("id") ON DELETE CASCADE,
        "seeker_user_id"       uuid         NOT NULL REFERENCES "service"."users"("id") ON DELETE RESTRICT,
        "payment_id"           uuid         REFERENCES "service"."payments"("id") ON DELETE RESTRICT,
        "fee_config_id"        uuid         REFERENCES "service"."platform_fee_configs"("id") ON DELETE RESTRICT,
        "cancelled_at"         timestamptz  NOT NULL,
        "scheduled_service_at" timestamptz,
        "within_48_hours"      boolean      NOT NULL DEFAULT false,
        "total_paid"           int          NOT NULL,
        "admin_fee"            int          NOT NULL DEFAULT 0,
        "refund_amount"        int          NOT NULL,
        "currency"             char(3)      NOT NULL DEFAULT 'AUD',
        "stripe_refund_id"     varchar(255) UNIQUE
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_job_cancellations_seeker_user_id" ON "service"."job_cancellations" ("seeker_user_id")`);
  }
}
