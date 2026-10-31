import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProviderSubmissionNotificationTypes1777467275542 implements MigrationInterface {
  name = 'AddProviderSubmissionNotificationTypes1777467275542';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TYPE "service"."notification_type" ADD VALUE IF NOT EXISTS 'verification_submitted'`);
    await queryRunner.query(`ALTER TYPE "service"."notification_type" ADD VALUE IF NOT EXISTS 'certification_submitted'`);
    await queryRunner.query(`ALTER TYPE "service"."notification_type" ADD VALUE IF NOT EXISTS 'certification_updated'`);
    await queryRunner.query(`ALTER TYPE "service"."notification_type" ADD VALUE IF NOT EXISTS 'certification_reviewed'`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // PostgreSQL does not support removing enum values directly.
  }
}
