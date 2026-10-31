import { MigrationInterface, QueryRunner } from 'typeorm';

export class DropProviderProfilesTable1777467275511 implements MigrationInterface {
  name = 'DropProviderProfilesTable1777467275511';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const tables = [
      { table: 'provider_work_info',            fkGuess: 'provider_work_info_profile_id_fkey' },
      { table: 'provider_bank_details',          fkGuess: 'provider_bank_details_profile_id_fkey' },
      { table: 'provider_professional_details',  fkGuess: 'provider_professional_details_profile_id_fkey' },
      { table: 'provider_certifications',        fkGuess: 'provider_certifications_profile_id_fkey' },
      { table: 'provider_employees',             fkGuess: 'provider_employees_profile_id_fkey' },
      { table: 'provider_verification_cases',    fkGuess: 'provider_verification_cases_profile_id_fkey' },
    ];

    for (const { table, fkGuess } of tables) {
      // Drop old FK (points to provider_profiles)
      await queryRunner.query(
        `ALTER TABLE "service"."${table}" DROP CONSTRAINT IF EXISTS "${fkGuess}"`,
      );

      // Add new FK pointing to profiles(id)
      await queryRunner.query(
        `ALTER TABLE "service"."${table}"
         ADD CONSTRAINT "${table}_profile_id_fkey"
         FOREIGN KEY ("profile_id") REFERENCES "service"."profiles"("id") ON DELETE CASCADE`,
      );
    }

    // Drop provider_profiles table (cascade drops any remaining FKs referencing it)
    await queryRunner.query(`DROP TABLE IF EXISTS "service"."provider_profiles" CASCADE`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Recreate provider_profiles
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "service"."provider_profiles" (
        "profile_id" uuid PRIMARY KEY REFERENCES "service"."profiles"("id") ON DELETE CASCADE
      )
    `);

    // Backfill: insert a row for every profile that has at least one provider sub-entity
    await queryRunner.query(`
      INSERT INTO "service"."provider_profiles" (profile_id)
      SELECT DISTINCT profile_id FROM "service"."provider_work_info"
      UNION
      SELECT DISTINCT profile_id FROM "service"."provider_bank_details"
      UNION
      SELECT DISTINCT profile_id FROM "service"."provider_professional_details"
      UNION
      SELECT DISTINCT profile_id FROM "service"."provider_certifications"
      UNION
      SELECT DISTINCT profile_id FROM "service"."provider_employees"
      UNION
      SELECT DISTINCT profile_id FROM "service"."provider_verification_cases"
      ON CONFLICT DO NOTHING
    `);

    const tables = [
      'provider_work_info', 'provider_bank_details', 'provider_professional_details',
      'provider_certifications', 'provider_employees', 'provider_verification_cases',
    ];

    for (const table of tables) {
      await queryRunner.query(
        `ALTER TABLE "service"."${table}" DROP CONSTRAINT IF EXISTS "${table}_profile_id_fkey"`,
      );
      await queryRunner.query(
        `ALTER TABLE "service"."${table}"
         ADD CONSTRAINT "${table}_profile_id_fkey"
         FOREIGN KEY ("profile_id") REFERENCES "service"."provider_profiles"("profile_id") ON DELETE CASCADE`,
      );
    }
  }
}
