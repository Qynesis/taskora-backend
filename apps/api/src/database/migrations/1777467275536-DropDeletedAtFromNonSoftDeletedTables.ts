import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Drops deleted_at from every table except users.
 *
 * Soft delete was inherited from BaseEntity by all 50 entities, but only users ever wrote to
 * it (UsersService.suspend -> softDelete). The other 49 carried a column that was NULL in every
 * row, while TypeORM silently appended `WHERE deleted_at IS NULL` to every query against them.
 * @DeleteDateColumn now lives on User alone.
 *
 * Irreversible in practice: down() restores the columns but not any values they held. That is
 * acceptable here precisely because nothing ever set them — the columns are provably all NULL.
 */
export class DropDeletedAtFromNonSoftDeletedTables1777467275536 implements MigrationInterface {
  name = 'DropDeletedAtFromNonSoftDeletedTables1777467275536';

  private static readonly TABLES = [
      'audit_logs',
      'bids',
      'categories',
      'category_assets',
      'conversations',
      'direct_messages',
      'fcm_tokens',
      'job_cancellations',
      'job_contracts',
      'job_photos',
      'jobs',
      'notifications',
      'payments',
      'platform_fee_configs',
      'profiles',
      'provider_bank_details',
      'provider_categories',
      'provider_certifications',
      'provider_employees',
      'provider_media',
      'provider_professional_details',
      'provider_skills',
      'provider_verification_cases',
      'provider_verification_step_files',
      'provider_verification_steps',
      'provider_work_info',
      'refund_evidence_photos',
      'refund_requests',
      'refunds',
      'reviews',
      'saved_payment_methods',
      'seeker_favourite_providers',
      'selections',
      'skills',
      'states',
      'stripe_accounts',
      'stripe_customers',
      'subscription_cancellation_requests',
      'subscription_periods',
      'subscriptions',
      'suburbs',
      'support_messages',
      'support_tickets',
      'transactions',
      'user_notification_settings',
      'user_reports',
      'user_warnings',
      'warning_messages',
      'warning_threads',
  ];

  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const table of DropDeletedAtFromNonSoftDeletedTables1777467275536.TABLES) {
      await queryRunner.query(
        `ALTER TABLE "service"."${table}" DROP COLUMN IF EXISTS "deleted_at"`,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    for (const table of DropDeletedAtFromNonSoftDeletedTables1777467275536.TABLES) {
      await queryRunner.query(
        `ALTER TABLE "service"."${table}" ADD COLUMN IF NOT EXISTS "deleted_at" timestamptz NULL`,
      );
    }
  }
}
