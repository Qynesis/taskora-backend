import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPostcodeToSuburbs1777467275534 implements MigrationInterface {
  name = 'AddPostcodeToSuburbs1777467275534';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Australian postcodes are always 4 digits, and leading zeros are significant (NT starts
    // 08xx), so this is char data, never numeric.
    //
    // Nullable because rows seeded before this migration have no postcode. The seed is the
    // source of truth for this table and repopulates it with postcodes; suburbs is a pure
    // lookup list with nothing referencing suburbs.id, so pre-existing rows are stale data
    // rather than something to preserve. See the report for the one-line dev cleanup.
    //
    // No unique constraint on (name, state_id, postcode) deliberately: Postgres treats NULLs
    // as distinct, so it would not actually prevent duplicates against the pre-existing
    // null-postcode rows, and adding one risks failing mid-deploy on a database this code has
    // never run against. The seed dedupes in application code instead.
    await queryRunner.query(`
      ALTER TABLE "service"."suburbs"
      ADD COLUMN IF NOT EXISTS "postcode" varchar(4) NULL
    `);

    // Supports lookup/filter by postcode; the picker also sorts within a state.
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_suburbs_postcode" ON "service"."suburbs" ("postcode")
    `);

    // Covers the seed's per-state existence check and the picker's state-scoped listing.
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_suburbs_state_id_name" ON "service"."suburbs" ("state_id", "name")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "service"."IDX_suburbs_state_id_name"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "service"."IDX_suburbs_postcode"`);
    await queryRunner.query(`ALTER TABLE "service"."suburbs" DROP COLUMN IF EXISTS "postcode"`);
  }
}
