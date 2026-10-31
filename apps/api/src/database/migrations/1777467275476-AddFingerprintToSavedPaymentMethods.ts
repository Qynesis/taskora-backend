import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddFingerprintToSavedPaymentMethods1777467275476 implements MigrationInterface {
    name = 'AddFingerprintToSavedPaymentMethods1777467275476';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "service"."saved_payment_methods"
            ADD COLUMN "fingerprint" varchar(255) NULL
        `);

        // Prevent the same physical card from being saved twice per user.
        // fingerprint is Stripe's stable hash of the card number — same card re-added
        // will have the same fingerprint. NULL values are excluded from uniqueness checks
        // in PostgreSQL, so rows without a fingerprint don't conflict.
        await queryRunner.query(`
            CREATE UNIQUE INDEX "UQ_saved_payment_methods_user_fingerprint"
            ON "service"."saved_payment_methods" ("seeker_user_id", "fingerprint")
            WHERE "fingerprint" IS NOT NULL AND "deleted_at" IS NULL
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX IF EXISTS "service"."UQ_saved_payment_methods_user_fingerprint"`);
        await queryRunner.query(`ALTER TABLE "service"."saved_payment_methods" DROP COLUMN "fingerprint"`);
    }
}
