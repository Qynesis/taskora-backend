import { MigrationInterface, QueryRunner } from 'typeorm';

export class RenameCityToSuburb1777467275513 implements MigrationInterface {
  name = 'RenameCityToSuburb1777467275513';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "service"."profiles" RENAME COLUMN "city" TO "suburb"`);

    await queryRunner.query(`ALTER TABLE "service"."cities" RENAME TO "suburbs"`);

    await queryRunner.query(`
      ALTER TABLE "service"."suburbs"
        RENAME CONSTRAINT "FK_cities_state_id" TO "FK_suburbs_state_id"
    `);

    await queryRunner.query(`ALTER INDEX IF EXISTS "IDX_cities_state_id" RENAME TO "IDX_suburbs_state_id"`);
    await queryRunner.query(`ALTER INDEX IF EXISTS "IDX_cities_name" RENAME TO "IDX_suburbs_name"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER INDEX IF EXISTS "IDX_suburbs_name" RENAME TO "IDX_cities_name"`);
    await queryRunner.query(`ALTER INDEX IF EXISTS "IDX_suburbs_state_id" RENAME TO "IDX_cities_state_id"`);

    await queryRunner.query(`
      ALTER TABLE "service"."suburbs"
        RENAME CONSTRAINT "FK_suburbs_state_id" TO "FK_cities_state_id"
    `);

    await queryRunner.query(`ALTER TABLE "service"."suburbs" RENAME TO "cities"`);
    await queryRunner.query(`ALTER TABLE "service"."profiles" RENAME COLUMN "suburb" TO "city"`);
  }
}
