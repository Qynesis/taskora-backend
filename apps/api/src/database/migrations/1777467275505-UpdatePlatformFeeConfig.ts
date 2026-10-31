import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdatePlatformFeeConfig1777467275505 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX IF EXISTS "service"."IDX_platform_fee_configs_effective_from"`);
        await queryRunner.query(`ALTER TABLE "platform_fee_configs" DROP COLUMN IF EXISTS "gst_percent"`);
        await queryRunner.query(`ALTER TABLE "platform_fee_configs" DROP COLUMN IF EXISTS "effective_from"`);
        await queryRunner.query(`ALTER TABLE "platform_fee_configs" DROP COLUMN IF EXISTS "effective_to"`);
        await queryRunner.query(`ALTER TABLE "platform_fee_configs" DROP COLUMN IF EXISTS "created_by_user_id"`);
        await queryRunner.query(`ALTER TABLE "platform_fee_configs" RENAME COLUMN "platform_fee_percent" TO "platform_charge"`);
        await queryRunner.query(`ALTER TABLE "platform_fee_configs" ALTER COLUMN "platform_charge" TYPE numeric(10,2)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "platform_fee_configs" ALTER COLUMN "platform_charge" TYPE numeric(5,2)`);
        await queryRunner.query(`ALTER TABLE "platform_fee_configs" RENAME COLUMN "platform_charge" TO "platform_fee_percent"`);
        await queryRunner.query(`ALTER TABLE "platform_fee_configs" ADD COLUMN "created_by_user_id" uuid REFERENCES "service"."users"("id") ON DELETE SET NULL`);
        await queryRunner.query(`ALTER TABLE "platform_fee_configs" ADD COLUMN "effective_to" timestamptz`);
        await queryRunner.query(`ALTER TABLE "platform_fee_configs" ADD COLUMN "effective_from" timestamptz NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "platform_fee_configs" ADD COLUMN "gst_percent" numeric(5,2) NOT NULL DEFAULT 10`);
        await queryRunner.query(`CREATE INDEX "IDX_platform_fee_configs_effective_from" ON "service"."platform_fee_configs" ("effective_from")`);
    }
}
