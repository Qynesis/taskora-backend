import { MigrationInterface, QueryRunner } from 'typeorm';

export class DropLegacyMessagesTable1777467275489 implements MigrationInterface {
  name = 'DropLegacyMessagesTable1777467275489';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "service"."user_reports" DROP COLUMN IF EXISTS "message_id"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "service"."messages"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "service"."messages" (
        "id"              uuid        NOT NULL DEFAULT gen_random_uuid(),
        "created_at"      timestamptz NOT NULL DEFAULT now(),
        "updated_at"      timestamptz NOT NULL DEFAULT now(),
        "deleted_at"      timestamptz,
        "conversation_id" uuid        REFERENCES "service"."conversations"("id") ON DELETE CASCADE,
        "sender_user_id"  uuid        REFERENCES "service"."users"("id") ON DELETE RESTRICT,
        "sender_type"     message_sender_type NOT NULL,
        "body"            text        NOT NULL,
        "attachments"     jsonb       DEFAULT '[]'::jsonb,
        CONSTRAINT "PK_messages" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      ALTER TABLE "service"."user_reports"
        ADD COLUMN IF NOT EXISTS "message_id" uuid
          REFERENCES "service"."messages"("id") ON DELETE SET NULL
    `);
  }
}
