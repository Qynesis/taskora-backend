import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddLastNotifiedStatusToStripeAccounts1777467275530 implements MigrationInterface {
  name = 'AddLastNotifiedStatusToStripeAccounts1777467275530';

  async up(queryRunner: QueryRunner): Promise<void> {
    // Tracks the last payout status we notified the provider about ('enabled' | 'action_required')
    // so the account.updated webhook handler fires one notification per meaningful transition
    // rather than on every intermediate event.
    await queryRunner.query(`
      ALTER TABLE "service"."stripe_accounts"
      ADD COLUMN IF NOT EXISTS "last_notified_status" varchar(32) NULL
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "service"."stripe_accounts"
      DROP COLUMN IF EXISTS "last_notified_status"
    `);
  }
}
