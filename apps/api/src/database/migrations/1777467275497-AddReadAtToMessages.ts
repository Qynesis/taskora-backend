import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddReadAtToMessages1777467275497 implements MigrationInterface {
  name = 'AddReadAtToMessages1777467275497';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "support_messages"
      ADD COLUMN IF NOT EXISTS "read_at" timestamptz NULL
    `);
    await queryRunner.query(`
      ALTER TABLE "warning_messages"
      ADD COLUMN IF NOT EXISTS "read_at" timestamptz NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "support_messages" DROP COLUMN IF EXISTS "read_at"`);
    await queryRunner.query(`ALTER TABLE "warning_messages" DROP COLUMN IF EXISTS "read_at"`);
  }
}
