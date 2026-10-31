import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMissingNotificationTypes1777467275491 implements MigrationInterface {
  name = 'AddMissingNotificationTypes1777467275491';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TYPE "service"."notification_type" ADD VALUE IF NOT EXISTS 'booking_confirmed'`);
    await queryRunner.query(`ALTER TYPE "service"."notification_type" ADD VALUE IF NOT EXISTS 'warning_thread_message'`);
    await queryRunner.query(`ALTER TYPE "service"."notification_type" ADD VALUE IF NOT EXISTS 'report_resolved'`);
    await queryRunner.query(`ALTER TYPE "service"."notification_type" ADD VALUE IF NOT EXISTS 'refund_requested'`);
    await queryRunner.query(`ALTER TYPE "service"."notification_type" ADD VALUE IF NOT EXISTS 'payment_received'`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // PostgreSQL does not support removing enum values directly.
  }
}
