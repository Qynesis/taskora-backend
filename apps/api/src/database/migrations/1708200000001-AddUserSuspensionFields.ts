import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserSuspensionFields1708200000001 implements MigrationInterface {
  name = 'AddUserSuspensionFields1708200000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "service"."users"
        ADD COLUMN IF NOT EXISTS "is_suspended"      boolean     NOT NULL DEFAULT false,
        ADD COLUMN IF NOT EXISTS "suspended_at"      timestamptz,
        ADD COLUMN IF NOT EXISTS "suspension_reason" text
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "service"."users"
        DROP COLUMN IF EXISTS "is_suspended",
        DROP COLUMN IF EXISTS "suspended_at",
        DROP COLUMN IF EXISTS "suspension_reason"
    `);
  }
}
