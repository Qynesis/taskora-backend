import { TransactionHelper } from './transaction.helper';
import { DataSource, QueryRunner } from 'typeorm';

describe('TransactionHelper', () => {
  let helper: TransactionHelper;
  let mockQueryRunner: Partial<QueryRunner>;
  let mockDataSource: Partial<DataSource>;

  beforeEach(() => {
    mockQueryRunner = {
      connect: jest.fn(),
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      rollbackTransaction: jest.fn(),
      release: jest.fn(),
      manager: {
        save: jest.fn().mockResolvedValue({ id: '1' }),
      } as unknown as QueryRunner['manager'],
    };
    mockDataSource = {
      createQueryRunner: jest.fn().mockReturnValue(mockQueryRunner),
    };
    helper = new TransactionHelper(mockDataSource as DataSource);
  });

  it('should commit on success', async () => {
    const result = await helper.run(async (qr) => {
      return await qr.manager.save('Entity', { name: 'test' });
    });

    expect(result).toEqual({ id: '1' });
    expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
    expect(mockQueryRunner.rollbackTransaction).not.toHaveBeenCalled();
    expect(mockQueryRunner.release).toHaveBeenCalled();
  });

  it('should rollback on error', async () => {
    await expect(
      helper.run(async () => {
        throw new Error('fail');
      }),
    ).rejects.toThrow('fail');

    expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
    expect(mockQueryRunner.commitTransaction).not.toHaveBeenCalled();
    expect(mockQueryRunner.release).toHaveBeenCalled();
  });
});
