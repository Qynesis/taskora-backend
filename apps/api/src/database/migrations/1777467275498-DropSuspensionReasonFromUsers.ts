import { MigrationInterface, QueryRunner } from 'typeorm';

export class DropSuspensionReasonFromUsers1777467275498 implements MigrationInterface {
  name = 'DropSuspensionReasonFromUsers1777467275498';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "service"."users" DROP COLUMN IF EXISTS "suspension_reason"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "service"."users" ADD COLUMN IF NOT EXISTS "suspension_reason" text`);
  }
}
