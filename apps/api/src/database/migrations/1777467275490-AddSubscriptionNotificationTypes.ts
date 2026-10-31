import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSubscriptionNotificationTypes1777467275490 implements MigrationInterface {
  name = 'AddSubscriptionNotificationTypes1777467275490';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TYPE "service"."notification_type" ADD VALUE IF NOT EXISTS 'subscription_activated'`);
    await queryRunner.query(`ALTER TYPE "service"."notification_type" ADD VALUE IF NOT EXISTS 'subscription_invoice_paid'`);
    await queryRunner.query(`ALTER TYPE "service"."notification_type" ADD VALUE IF NOT EXISTS 'subscription_payment_failed'`);
    await queryRunner.query(`ALTER TYPE "service"."notification_type" ADD VALUE IF NOT EXISTS 'subscription_ended'`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // PostgreSQL does not support removing enum values directly.
    // To revert: recreate the enum without these values and cast the column.
  }
}
