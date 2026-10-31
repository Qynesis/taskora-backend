import { MigrationInterface, QueryRunner } from 'typeorm';

export class WidenTransactionsTxnRef1777467275487 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "service"."transactions" ALTER COLUMN "txn_ref" TYPE varchar(80)`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "service"."transactions" ALTER COLUMN "txn_ref" TYPE varchar(20)`,
        );
    }
}
