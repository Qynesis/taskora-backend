import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddLocationTables1708200000002 implements MigrationInterface {
  name = 'AddLocationTables1708200000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "service"."states" (
        "id"         uuid         PRIMARY KEY DEFAULT uuid_generate_v4(),
        "created_at" timestamptz  NOT NULL DEFAULT now(),
        "updated_at" timestamptz  NOT NULL DEFAULT now(),
        "deleted_at" timestamptz,
        "name"       varchar(100) NOT NULL,
        "code"       char(3)      NOT NULL,
        CONSTRAINT "UQ_states_name" UNIQUE ("name"),
        CONSTRAINT "UQ_states_code" UNIQUE ("code")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_states_code" ON "service"."states" ("code")
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "service"."cities" (
        "id"         uuid         PRIMARY KEY DEFAULT uuid_generate_v4(),
        "created_at" timestamptz  NOT NULL DEFAULT now(),
        "updated_at" timestamptz  NOT NULL DEFAULT now(),
        "deleted_at" timestamptz,
        "name"       varchar(100) NOT NULL,
        "state_id"   uuid         NOT NULL,
        CONSTRAINT "FK_cities_state_id" FOREIGN KEY ("state_id")
          REFERENCES "service"."states" ("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_cities_state_id" ON "service"."cities" ("state_id")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_cities_name" ON "service"."cities" ("name")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "service"."cities"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "service"."states"`);
  }
}
