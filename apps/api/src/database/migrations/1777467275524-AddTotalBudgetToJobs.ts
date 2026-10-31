import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTotalBudgetToJobs1777467275524 implements MigrationInterface {
  name = 'AddTotalBudgetToJobs1777467275524';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "service"."jobs"
      ADD COLUMN IF NOT EXISTS "total_budget" numeric(10, 2) NULL
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "service"."jobs"
      DROP COLUMN IF EXISTS "total_budget"
    `);
  }
}
