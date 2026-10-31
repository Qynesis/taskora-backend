import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAttachmentsToDirectMessages1777467275478 implements MigrationInterface {
  name = 'AddAttachmentsToDirectMessages1777467275478';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "service"."direct_messages"
        ADD COLUMN "attachments" jsonb NOT NULL DEFAULT '[]'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "service"."direct_messages"
        DROP COLUMN "attachments"
    `);
  }
}
