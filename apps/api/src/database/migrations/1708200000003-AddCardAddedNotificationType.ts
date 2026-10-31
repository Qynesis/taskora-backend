import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCardAddedNotificationType1708200000003 implements MigrationInterface {
  name = 'AddCardAddedNotificationType1708200000003';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TYPE "service"."notification_type" ADD VALUE IF NOT EXISTS 'card_added'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // PostgreSQL does not support removing enum values directly.
    // To rollback, recreate the enum without 'card_added' and remap the column.
    await queryRunner.query(`
      ALTER TABLE "service"."notifications"
        ALTER COLUMN "type" TYPE varchar(50)
    `);
    await queryRunner.query(`DROP TYPE IF EXISTS "service"."notification_type"`);
    await queryRunner.query(`
      CREATE TYPE "service"."notification_type" AS ENUM (
        'warning', 'bid_received', 'bid_accepted', 'bid_declined',
        'job_started', 'job_completed', 'job_cancelled',
        'new_message', 'warning_received', 'support_reply'
      )
    `);
    await queryRunner.query(`
      ALTER TABLE "service"."notifications"
        ALTER COLUMN "type" TYPE "service"."notification_type"
        USING "type"::"service"."notification_type"
    `);
  }
}
