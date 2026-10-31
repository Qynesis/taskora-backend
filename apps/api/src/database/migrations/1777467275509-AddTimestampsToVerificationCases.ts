import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTimestampsToVerificationCases1777467275509 implements MigrationInterface {
  name = 'AddTimestampsToVerificationCases1777467275509';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "service"."provider_verification_cases"
       ADD COLUMN IF NOT EXISTS "created_at" timestamptz NOT NULL DEFAULT NOW(),
       ADD COLUMN IF NOT EXISTS "updated_at" timestamptz NOT NULL DEFAULT NOW()`,
    );

    // Backfill existing rows: use the earliest step's created_at as the case created_at
    await queryRunner.query(
      `UPDATE "service"."provider_verification_cases" vc
       SET "created_at" = COALESCE(
         (SELECT MIN(s.created_at)
          FROM "service"."provider_verification_steps" s
          WHERE s.case_id = vc.profile_id),
         NOW()
       ),
       "updated_at" = COALESCE(
         (SELECT MAX(s.created_at)
          FROM "service"."provider_verification_steps" s
          WHERE s.case_id = vc.profile_id),
         NOW()
       )`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "service"."provider_verification_cases"
       DROP COLUMN IF EXISTS "created_at",
       DROP COLUMN IF EXISTS "updated_at"`,
    );
  }
}
