import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMccToCategories1777467275532 implements MigrationInterface {
  name = 'AddMccToCategories1777467275532';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Stripe Merchant Category Code, sent as business_profile.mcc during Connect onboarding.
    //
    // This column was originally created ad-hoc by scripts/seed-category-mcc.mjs (since removed)
    // running `ALTER TABLE ... ADD COLUMN IF NOT EXISTS mcc` directly against the dev database,
    // so it never existed in the migration chain. A database built purely from migrations
    // therefore lacked the column while Category still declared it, breaking every category
    // query. IF NOT EXISTS keeps this a no-op on databases the script already touched.
    //
    // Values are populated by the seed (seed-categories.ts), not here — the seed owns category rows.
    await queryRunner.query(
      `ALTER TABLE "service"."categories" ADD COLUMN IF NOT EXISTS "mcc" varchar(10) NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "service"."categories" DROP COLUMN IF EXISTS "mcc"`,
    );
  }
}
