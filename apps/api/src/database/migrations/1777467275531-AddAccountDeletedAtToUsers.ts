import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAccountDeletedAtToUsers1777467275531 implements MigrationInterface {
  name = 'AddAccountDeletedAtToUsers1777467275531';

  async up(queryRunner: QueryRunner): Promise<void> {
    // Dedicated marker for user-initiated account deletion (GDPR / Play Store "delete my account").
    // Deliberately a plain column — NOT the BaseEntity deleted_at (@DeleteDateColumn), which hides
    // rows from joins and is already used by admin suspend(). Account deletion is a distinct axis
    // from the admin isActive/isSuspended moderation flags: it is permanent and anonymized.
    await queryRunner.query(`
      ALTER TABLE "service"."users"
      ADD COLUMN IF NOT EXISTS "account_deleted_at" timestamptz NULL
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "service"."users"
      DROP COLUMN IF EXISTS "account_deleted_at"
    `);
  }
}
