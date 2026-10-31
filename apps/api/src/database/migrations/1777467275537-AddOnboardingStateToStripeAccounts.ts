import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddOnboardingStateToStripeAccounts1777467275537 implements MigrationInterface {
  name = 'AddOnboardingStateToStripeAccounts1777467275537';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // The account.updated webhook already derives whether Stripe is waiting on the provider or
    // just reviewing, but it only used that to decide whether to notify and then discarded it.
    // GET /me/stripe/status could therefore only answer `onboarded: false` with no reason —
    // a provider blocked on a document and a provider waiting on Stripe looked identical.
    await queryRunner.query(`
      ALTER TABLE "service"."stripe_accounts"
        ADD COLUMN IF NOT EXISTS "onboarding_state"       varchar(20)  NOT NULL DEFAULT 'pending',
        ADD COLUMN IF NOT EXISTS "requirements_due"       jsonb        NOT NULL DEFAULT '[]'::jsonb,
        ADD COLUMN IF NOT EXISTS "disabled_reason"        varchar(100) NULL,
        ADD COLUMN IF NOT EXISTS "requirements_synced_at" timestamptz  NULL
    `);

    // Existing rows predate the column. Anything already live is 'enabled'; the rest stay
    // 'pending' until their next account.updated event, which is the correct conservative
    // reading — we do not know of anything outstanding for them.
    await queryRunner.query(`
      UPDATE "service"."stripe_accounts"
      SET "onboarding_state" = 'enabled'
      WHERE "charges_enabled" = true AND "payouts_enabled" = true
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "service"."stripe_accounts"
        DROP COLUMN IF EXISTS "requirements_synced_at",
        DROP COLUMN IF EXISTS "disabled_reason",
        DROP COLUMN IF EXISTS "requirements_due",
        DROP COLUMN IF EXISTS "onboarding_state"
    `);
  }
}
