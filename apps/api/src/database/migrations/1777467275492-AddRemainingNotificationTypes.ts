import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRemainingNotificationTypes1777467275492 implements MigrationInterface {
  name = 'AddRemainingNotificationTypes1777467275492';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TYPE "service"."notification_type" ADD VALUE IF NOT EXISTS 'refund_rejected'`);
    await queryRunner.query(`ALTER TYPE "service"."notification_type" ADD VALUE IF NOT EXISTS 'booking_status_changed'`);
    await queryRunner.query(`ALTER TYPE "service"."notification_type" ADD VALUE IF NOT EXISTS 'verification_reviewed'`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // PostgreSQL does not support removing enum values directly.
  }
}
