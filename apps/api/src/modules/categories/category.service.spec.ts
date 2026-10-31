import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { CategoryService } from './category.service';
import { Category } from '../../database/entities/category.entity';
import { CategoryAsset } from '../../database/entities/category-asset.entity';
import { CategoryQueryDto } from './dto/category-query.dto';
import { TransactionHelper } from '../../database/transaction.helper';
import { DomainEventEmitter } from '../../events/domain-event-emitter.service';
import {
  createMockRepository,
  createMockTransactionHelper,
  createMockEventEmitter,
} from '../../../test/helpers/test-factory';

describe('CategoryService', () => {
  let module: TestingModule;
  let service: CategoryService;
  let repository: ReturnType<typeof createMockRepository> & { createQueryBuilder: jest.Mock };

  beforeEach(async () => {
    repository = {
      ...createMockRepository(),
      createQueryBuilder: jest.fn(),
    } as any;
    const txHelper = createMockTransactionHelper();
    const eventEmitter = createMockEventEmitter();

    module = await Test.createTestingModule({
      providers: [
        CategoryService,
        { provide: getRepositoryToken(Category), useValue: repository },
        { provide: getRepositoryToken(CategoryAsset), useValue: createMockRepository() },
        { provide: TransactionHelper, useValue: txHelper },
        { provide: DomainEventEmitter, useValue: eventEmitter },
      ],
    }).compile();

    service = module.get<CategoryService>(CategoryService);
  });

  afterEach(() => module.close());

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return paginated results', async () => {
      repository.findAndCount.mockResolvedValue([[{ id: 'c1', name: 'Cleaning' }], 1]);
      const result = await service.findAll(new CategoryQueryDto());
      expect(result.items).toEqual([{ label: 'Cleaning', value: 'c1' }]);
      expect(result.total).toBe(1);
    });
  });

  describe('findNames', () => {
    function makeQb(rows: any[], total: number) {
      const qb: any = {
        select:           jest.fn().mockReturnThis(),
        orderBy:          jest.fn().mockReturnThis(),
        skip:             jest.fn().mockReturnThis(),
        take:             jest.fn().mockReturnThis(),
        where:            jest.fn().mockReturnThis(),
        getManyAndCount:  jest.fn().mockResolvedValue([rows, total]),
      };
      return qb;
    }

    it('should return paginated id/name list sorted by name', async () => {
      const qb = makeQb([{ id: 'c1', name: 'Cleaning' }, { id: 'c2', name: 'Gardening' }], 2);
      repository.createQueryBuilder.mockReturnValue(qb);

      const result = await service.findNames({ page: 1, limit: 10 } as any);

      expect(repository.createQueryBuilder).toHaveBeenCalledWith('c');
      expect(result.items).toEqual([
        { value: 'c1', level: 'Cleaning', icon: null },
        { value: 'c2', level: 'Gardening', icon: null },
      ]);
      expect(result.total).toBe(2);
    });

    it('should select c.iconUrl from the query builder', async () => {
      const qb = makeQb([], 0);
      repository.createQueryBuilder.mockReturnValue(qb);

      await service.findNames({ page: 1, limit: 10 } as any);

      expect(qb.select).toHaveBeenCalledWith(
        expect.arrayContaining(['c.iconUrl']),
      );
    });

    it('should map iconUrl to icon when present', async () => {
      const url = 'https://cdn.example.com/categories/electricians.png';
      const qb = makeQb([{ id: 'c1', name: 'Electricians', iconUrl: url }], 1);
      repository.createQueryBuilder.mockReturnValue(qb);

      const result = await service.findNames({ page: 1, limit: 10 } as any);

      expect(result.items[0]!.icon).toBe(url);
    });

    it('should set icon to null when iconUrl is undefined', async () => {
      const qb = makeQb([{ id: 'c1', name: 'Plumbing', iconUrl: undefined }], 1);
      repository.createQueryBuilder.mockReturnValue(qb);

      const result = await service.findNames({ page: 1, limit: 10 } as any);

      expect(result.items[0]!.icon).toBeNull();
    });

    it('should return empty array when no categories exist', async () => {
      const qb = makeQb([], 0);
      repository.createQueryBuilder.mockReturnValue(qb);

      const result = await service.findNames({ page: 1, limit: 10 } as any);

      expect(result.items).toEqual([]);
      expect(result.total).toBe(0);
    });
  });

  describe('findNames?featured=true', () => {
    function makeFeaturedQb(rows: any[]) {
      const qb: any = {
        select:  jest.fn().mockReturnThis(),
        where:   jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(rows),
      };
      return qb;
    }

    it('returns only the featured categories in their fixed order, not alphabetical', async () => {
      // DB returns them in an arbitrary order; the service must re-order to the curated sequence.
      const qb = makeFeaturedQb([
        { id: 'c-pest', name: 'Pest Control', iconUrl: null },
        { id: 'c-plumb', name: 'Plumbing', iconUrl: null },
        { id: 'c-elec', name: 'Electricians', iconUrl: null },
        { id: 'c-hand', name: 'Handyman', iconUrl: null },
        { id: 'c-build', name: 'Building & Renovations', iconUrl: null },
        { id: 'c-carp', name: 'Carpentry', iconUrl: null },
        { id: 'c-clean', name: 'Domestic Cleaning', iconUrl: null },
        { id: 'c-remov', name: 'Removalists (Transport)', iconUrl: null },
      ]);
      repository.createQueryBuilder.mockReturnValue(qb);

      const result = await service.findNames({ page: 1, limit: 10, featured: true } as any);

      expect(result.items.map((i) => i.level)).toEqual([
        'Plumbing',
        'Handyman',
        'Electricians',
        'Building & Renovations',
        'Carpentry',
        'Domestic Cleaning',
        'Removalists (Transport)',
        'Pest Control',
      ]);
      expect(result.total).toBe(8);
      // Featured set must ignore pagination — never call the paginated getManyAndCount path.
      expect(qb.getMany).toHaveBeenCalled();
    });

    it('skips a configured name that is missing from the DB rather than emitting an empty slot', async () => {
      const qb = makeFeaturedQb([
        { id: 'c-plumb', name: 'Plumbing', iconUrl: null },
        { id: 'c-hand', name: 'Handyman', iconUrl: null },
      ]);
      repository.createQueryBuilder.mockReturnValue(qb);

      const result = await service.findNames({ page: 1, limit: 10, featured: true } as any);

      expect(result.items.map((i) => i.level)).toEqual(['Plumbing', 'Handyman']);
      expect(result.total).toBe(2);
      expect(result.items.every((i) => i.value != null)).toBe(true);
    });
  });

  /*describe('findOne', () => {
    it('should throw NotFoundException when not found', async () => {
      repository.findOne.mockResolvedValue(null);
      await expect(service.findOne('non-existent-id')).rejects.toThrow(NotFoundException);
    });
  });*/
});
