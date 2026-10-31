import { MigrationInterface, QueryRunner } from 'typeorm';

export class ConsolidateProviderColumn1777467275488 implements MigrationInterface {
  name = 'ConsolidateProviderColumn1777467275488';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Copy selected_provider_id into provider_user_id for all BIDDING jobs that have
    // a selected provider but no provider_user_id (direct bookings already have it set).
    await queryRunner.query(`
      UPDATE "service"."jobs"
      SET "provider_user_id" = "selected_provider_id"
      WHERE "type" = 'bidding'
        AND "selected_provider_id" IS NOT NULL
        AND "provider_user_id" IS NULL
    `);

    await queryRunner.query(`DROP INDEX IF EXISTS "service"."IDX_jobs_selected_provider_id"`);
    await queryRunner.query(`ALTER TABLE "service"."jobs" DROP COLUMN "selected_provider_id"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "service"."jobs" ADD COLUMN "selected_provider_id" uuid REFERENCES "service"."users"("id") ON DELETE SET NULL`);
    await queryRunner.query(`
      UPDATE "service"."jobs"
      SET "selected_provider_id" = "provider_user_id"
      WHERE "type" = 'bidding' AND "provider_user_id" IS NOT NULL
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_jobs_selected_provider_id" ON "service"."jobs" ("selected_provider_id")`);
  }
}
