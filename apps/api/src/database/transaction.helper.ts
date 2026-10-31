import { Injectable } from '@nestjs/common';
import { DataSource, QueryRunner } from 'typeorm';

@Injectable()
export class TransactionHelper {
  constructor(private readonly dataSource: DataSource) {}

  /**
   * Wraps a callback in a database transaction using QueryRunner.
   * The transaction is committed if the callback succeeds, or rolled back on error.
   *
   * Usage:
   *   await this.txHelper.run(async (qr) => {
   *     await qr.manager.save(EntityA, dataA);
   *     await qr.manager.save(EntityB, dataB);
   *   });
   */
  async run<T>(callback: (queryRunner: QueryRunner) => Promise<T>): Promise<T> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const result = await callback(queryRunner);
      await queryRunner.commitTransaction();
      return result;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
