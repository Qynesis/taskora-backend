import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDeletedAtToVerificationCases1777467275512 implements MigrationInterface {
  name = 'AddDeletedAtToVerificationCases1777467275512';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "service"."provider_verification_cases"
       ADD COLUMN IF NOT EXISTS "deleted_at" timestamptz`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "service"."provider_verification_cases"
       DROP COLUMN IF EXISTS "deleted_at"`,
    );
  }
}
