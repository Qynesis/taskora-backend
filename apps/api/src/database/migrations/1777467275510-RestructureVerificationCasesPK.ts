import { MigrationInterface, QueryRunner } from 'typeorm';

export class RestructureVerificationCasesPK1777467275510 implements MigrationInterface {
  name = 'RestructureVerificationCasesPK1777467275510';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Add new id column
    await queryRunner.query(
      `ALTER TABLE "service"."provider_verification_cases"
       ADD COLUMN IF NOT EXISTS "id" uuid NOT NULL DEFAULT uuid_generate_v4()`,
    );

    // 2. Add temp column for new case reference in steps
    await queryRunner.query(
      `ALTER TABLE "service"."provider_verification_steps" ADD COLUMN IF NOT EXISTS "case_id_new" uuid`,
    );

    // 3. Backfill case_id_new from the new cases.id
    await queryRunner.query(
      `UPDATE "service"."provider_verification_steps" s
       SET "case_id_new" = vc."id"
       FROM "service"."provider_verification_cases" vc
       WHERE vc."profile_id" = s."case_id"`,
    );

    // 4. Drop old index and FK on steps.case_id BEFORE touching the PK
    await queryRunner.query(
      `DROP INDEX IF EXISTS "service"."IDX_provider_verification_steps_case_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "service"."provider_verification_steps"
       DROP CONSTRAINT IF EXISTS "provider_verification_steps_case_id_fkey"`,
    );

    // 5. Now safe to drop the old PK on cases
    await queryRunner.query(
      `ALTER TABLE "service"."provider_verification_cases" DROP CONSTRAINT IF EXISTS "provider_verification_cases_pkey"`,
    );

    // 6. Make id the new PK and add unique constraint on profile_id
    await queryRunner.query(
      `ALTER TABLE "service"."provider_verification_cases" ADD PRIMARY KEY ("id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "service"."provider_verification_cases"
       ADD CONSTRAINT "uq_verification_cases_profile_id" UNIQUE ("profile_id")`,
    );

    // 7. Swap case_id column in steps
    await queryRunner.query(
      `ALTER TABLE "service"."provider_verification_steps" DROP COLUMN "case_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "service"."provider_verification_steps" RENAME COLUMN "case_id_new" TO "case_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "service"."provider_verification_steps" ALTER COLUMN "case_id" SET NOT NULL`,
    );

    // 8. Add new FK referencing cases.id
    await queryRunner.query(
      `ALTER TABLE "service"."provider_verification_steps"
       ADD CONSTRAINT "fk_verification_steps_case_id"
       FOREIGN KEY ("case_id") REFERENCES "service"."provider_verification_cases"("id") ON DELETE CASCADE`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_provider_verification_steps_case_id" ON "service"."provider_verification_steps" ("case_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "service"."IDX_provider_verification_steps_case_id"`);
    await queryRunner.query(`ALTER TABLE "service"."provider_verification_steps" DROP CONSTRAINT IF EXISTS "fk_verification_steps_case_id"`);

    await queryRunner.query(`ALTER TABLE "service"."provider_verification_steps" ADD COLUMN "case_id_old" uuid`);
    await queryRunner.query(
      `UPDATE "service"."provider_verification_steps" s
       SET "case_id_old" = vc."profile_id"
       FROM "service"."provider_verification_cases" vc
       WHERE vc."id" = s."case_id"`,
    );
    await queryRunner.query(`ALTER TABLE "service"."provider_verification_steps" DROP COLUMN "case_id"`);
    await queryRunner.query(`ALTER TABLE "service"."provider_verification_steps" RENAME COLUMN "case_id_old" TO "case_id"`);
    await queryRunner.query(`ALTER TABLE "service"."provider_verification_steps" ALTER COLUMN "case_id" SET NOT NULL`);

    await queryRunner.query(`ALTER TABLE "service"."provider_verification_cases" DROP CONSTRAINT IF EXISTS "uq_verification_cases_profile_id"`);
    await queryRunner.query(`ALTER TABLE "service"."provider_verification_cases" DROP CONSTRAINT IF EXISTS "provider_verification_cases_pkey"`);
    await queryRunner.query(`ALTER TABLE "service"."provider_verification_cases" ADD PRIMARY KEY ("profile_id")`);
    await queryRunner.query(`ALTER TABLE "service"."provider_verification_cases" DROP COLUMN IF EXISTS "id"`);

    await queryRunner.query(
      `ALTER TABLE "service"."provider_verification_steps"
       ADD CONSTRAINT "provider_verification_steps_case_id_fkey"
       FOREIGN KEY ("case_id") REFERENCES "service"."provider_verification_cases"("profile_id") ON DELETE CASCADE`,
    );
    await queryRunner.query(`CREATE INDEX "IDX_provider_verification_steps_case_id" ON "service"."provider_verification_steps" ("case_id")`);
  }
}
