import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { AdminService } from './admin.service';
import { User } from '../../database/entities/user.entity';
import { Job } from '../../database/entities/job.entity';
import { Payment } from '../../database/entities/payment.entity';
import { Refund } from '../../database/entities/refund.entity';
import { ProviderVerificationCase } from '../../database/entities/provider_verification_cases.entity';
import { ProviderCertification } from '../../database/entities/provider_certification.entity';
import { Transaction } from '../../database/entities/transaction.entity';
import { VerificationService } from '../verification/verification.service';
import { AuditService } from '../audit/audit.service';
import { AppCacheService } from '../../cache/cache.service';
import { DomainEventEmitter } from '../../events/domain-event-emitter.service';
import { PaginatedResponseDto } from '../../interfaces/paginated-response.dto';
import { createMockRepository } from '../../../test/helpers/test-factory';

describe('AdminService', () => {
  let module: TestingModule;
  let service: AdminService;
  let userRepo: ReturnType<typeof createMockRepository> & { createQueryBuilder: jest.Mock };
  let managerQuery: jest.Mock;

  beforeEach(async () => {
    managerQuery = jest.fn();

    userRepo = {
      ...createMockRepository(),
      createQueryBuilder: jest.fn(),
    } as any;

    const paymentRepo = {
      ...createMockRepository(),
      manager: { query: managerQuery },
    };

    module = await Test.createTestingModule({
      providers: [
        AdminService,
        { provide: getRepositoryToken(User), useValue: userRepo },
        { provide: getRepositoryToken(Job), useValue: createMockRepository() },
        { provide: getRepositoryToken(Payment), useValue: paymentRepo },
        { provide: getRepositoryToken(Refund), useValue: createMockRepository() },
        { provide: getRepositoryToken(ProviderCertification), useValue: createMockRepository() },
        { provide: getRepositoryToken(ProviderVerificationCase), useValue: createMockRepository() },
        { provide: getRepositoryToken(Transaction), useValue: createMockRepository() },
        { provide: VerificationService, useValue: { getCase: jest.fn(), reviewStep: jest.fn() } },
        { provide: AuditService, useValue: { findAll: jest.fn(), log: jest.fn(), findOne: jest.fn() } },
        { provide: AppCacheService, useValue: { delByPrefix: jest.fn(), del: jest.fn() } },
        { provide: DomainEventEmitter, useValue: { emit: jest.fn() } },
      ],
    }).compile();

    service = module.get<AdminService>(AdminService);
  });

  afterEach(() => module.close());

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should throw NotFoundException when provider is missing', async () => {
    const qb: any = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      leftJoinAndMapOne: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getOne: jest.fn().mockResolvedValue(null),
    };
    userRepo.createQueryBuilder.mockReturnValue(qb);

    await expect(service.findOneProvider('missing-id')).rejects.toThrow(NotFoundException);
  });

  // ── getPaymentSummary ──────────────────────────────────────────────────────

  describe('getPaymentSummary', () => {
    it('returns numeric fields coerced from DB strings', async () => {
      managerQuery.mockResolvedValueOnce([
        { platformRevenue: '4200.50', totalTransactions: '38', totalRefunded: '300.00', currency: 'AUD' },
      ]);

      const result = await service.getPaymentSummary();

      expect(result.platformRevenue).toBe(4200.5);
      expect(result.totalTransactions).toBe(38);
      expect(result.totalRefunded).toBe(300);
      expect(result.currency).toBe('AUD');
    });

    it('returns zeros when no payments exist', async () => {
      managerQuery.mockResolvedValueOnce([
        { platformRevenue: '0', totalTransactions: '0', totalRefunded: '0', currency: 'AUD' },
      ]);

      const result = await service.getPaymentSummary();

      expect(result.platformRevenue).toBe(0);
      expect(result.totalTransactions).toBe(0);
      expect(result.totalRefunded).toBe(0);
    });
  });

  // ── getTransactionList ─────────────────────────────────────────────────────

  describe('getTransactionList', () => {
    const row1 = {
      transactionId: 'pay-1',
      type: 'payment',
      amount: 150,
      currency: 'AUD',
      date: new Date('2025-03-01'),
      senderName: 'Alice Smith',
      senderEmail: 'alice@example.com',
    };

    it('returns PaginatedResponseDto with items and total', async () => {
      managerQuery
        .mockResolvedValueOnce([row1])
        .mockResolvedValueOnce([{ count: '1' }]);

      const result = await service.getTransactionList({ page: 1, limit: 10, sortBy: 'createdAt', order: 'DESC' });

      expect(result).toBeInstanceOf(PaginatedResponseDto);
      expect(result.items).toHaveLength(1);
      expect(result.items[0]).toMatchObject({ transactionId: 'pay-1', type: 'payment' });
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
    });

    it('passes LIMIT and OFFSET derived from page/limit', async () => {
      managerQuery
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{ count: '0' }]);

      await service.getTransactionList({ page: 3, limit: 5, sortBy: 'createdAt', order: 'DESC' });

      // data query: last two params are limit=5 and offset=10
      const dataCallArgs: unknown[] = managerQuery.mock.calls[0]![1] as unknown[];
      expect(dataCallArgs.at(-2)).toBe(5);
      expect(dataCallArgs.at(-1)).toBe(10);
    });

    it('adds month and current year to SQL params when month is provided', async () => {
      managerQuery
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{ count: '0' }]);

      await service.getTransactionList({ page: 1, limit: 10, sortBy: 'createdAt', order: 'DESC', month: 3 });

      const dataCallParams: unknown[] = managerQuery.mock.calls[0]![1] as unknown[];
      expect(dataCallParams).toContain(3);
      expect(dataCallParams).toContain(new Date().getFullYear());
      const sql: string = managerQuery.mock.calls[0]![0] as string;
      expect(sql).toContain('EXTRACT(MONTH FROM');
    });

    it('adds week and current year to SQL params when week is provided', async () => {
      managerQuery
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{ count: '0' }]);

      await service.getTransactionList({ page: 1, limit: 10, sortBy: 'createdAt', order: 'DESC', week: 12 });

      const dataCallParams: unknown[] = managerQuery.mock.calls[0]![1] as unknown[];
      expect(dataCallParams).toContain(12);
      expect(dataCallParams).toContain(new Date().getFullYear());
      const sql: string = managerQuery.mock.calls[0]![0] as string;
      expect(sql).toContain('EXTRACT(WEEK FROM');
    });

    it('uses month filter and ignores week when both are provided', async () => {
      managerQuery
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{ count: '0' }]);

      await service.getTransactionList({ page: 1, limit: 10, sortBy: 'createdAt', order: 'DESC', month: 6, week: 24 });

      const sql: string = managerQuery.mock.calls[0]![0] as string;
      expect(sql).toContain('EXTRACT(MONTH FROM');
      expect(sql).not.toContain('EXTRACT(WEEK FROM');
    });

    it('uses single-branch query when type=payment', async () => {
      managerQuery
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{ count: '0' }]);

      await service.getTransactionList({
        page: 1, limit: 10, sortBy: 'createdAt', order: 'DESC', type: 'payment' as any,
      });

      const sql: string = managerQuery.mock.calls[0]![0] as string;
      expect(sql).not.toContain('UNION ALL');
    });

    it('uses UNION ALL query when no type filter', async () => {
      managerQuery
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{ count: '0' }]);

      await service.getTransactionList({ page: 1, limit: 10, sortBy: 'createdAt', order: 'DESC' });

      const sql: string = managerQuery.mock.calls[0]![0] as string;
      expect(sql).toContain('UNION ALL');
    });
  });

  // ── exportPaymentsCsv ──────────────────────────────────────────────────────

  describe('exportPaymentsCsv', () => {
    it('returns base64-encoded CSV with correct headers', async () => {
      managerQuery
        .mockResolvedValueOnce([
          {
            transactionId: 'pay-abc',
            type: 'payment',
            amount: 200,
            currency: 'AUD',
            date: new Date('2025-06-01T10:00:00Z'),
            senderName: 'Bob Jones',
            senderEmail: 'bob@example.com',
          },
        ])
        .mockResolvedValueOnce([{ count: '1' }]);

      const result = await service.exportPaymentsCsv();

      expect(result.filename).toMatch(/^payments-\d{4}-\d{2}-\d{2}\.csv$/);
      expect(typeof result.data).toBe('string');

      const decoded = Buffer.from(result.data, 'base64').toString('utf8');
      expect(decoded).toContain('Transaction ID,Type,Sender,Email,Amount,Currency,Date');
      expect(decoded).toContain('pay-abc');
      expect(decoded).toContain('payment');
      expect(decoded).toContain('"Bob Jones"');
      expect(decoded).toContain('bob@example.com');
      expect(decoded).toContain('200');
    });

    it('escapes double-quotes in sender name', async () => {
      managerQuery
        .mockResolvedValueOnce([
          {
            transactionId: 'pay-xyz',
            type: 'payment',
            amount: 50,
            currency: 'AUD',
            date: new Date(),
            senderName: 'Alice "A" Smith',
            senderEmail: 'alice@example.com',
          },
        ])
        .mockResolvedValueOnce([{ count: '1' }]);

      const { data } = await service.exportPaymentsCsv();
      const decoded = Buffer.from(data, 'base64').toString('utf8');

      expect(decoded).toContain('"Alice ""A"" Smith"');
    });

    it('returns header-only CSV when no transactions exist', async () => {
      managerQuery
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{ count: '0' }]);

      const { data } = await service.exportPaymentsCsv();
      const decoded = Buffer.from(data, 'base64').toString('utf8');

      expect(decoded.trim()).toBe('Transaction ID,Type,Sender,Email,Amount,Currency,Date');
    });
  });
});
