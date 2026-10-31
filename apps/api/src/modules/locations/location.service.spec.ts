import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { LocationService } from './location.service';
import { State } from '../../database/entities/state.entity';
import { Suburb } from '../../database/entities/suburb.entity';
import { createMockRepository } from '../../../test/helpers/test-factory';
import { LocationQueryDto, SuburbQueryDto } from './dto/location-query.dto';

const makeStateQb = (rows: any[], total: number) => ({
  select: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  skip: jest.fn().mockReturnThis(),
  take: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  getManyAndCount: jest.fn().mockResolvedValue([rows, total]),
});

const makeSuburbQb = (rows: any[], total: number) => ({
  innerJoin: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  addOrderBy: jest.fn().mockReturnThis(),
  skip: jest.fn().mockReturnThis(),
  take: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  getManyAndCount: jest.fn().mockResolvedValue([rows, total]),
});

describe('LocationService', () => {
  let module: TestingModule;
  let service: LocationService;
  let stateRepo: ReturnType<typeof createMockRepository> & { createQueryBuilder: jest.Mock };
  let suburbRepo: ReturnType<typeof createMockRepository> & { createQueryBuilder: jest.Mock };

  beforeEach(async () => {
    stateRepo = { ...createMockRepository(), createQueryBuilder: jest.fn() } as any;
    suburbRepo = { ...createMockRepository(), createQueryBuilder: jest.fn() } as any;

    module = await Test.createTestingModule({
      providers: [
        LocationService,
        { provide: getRepositoryToken(State), useValue: stateRepo },
        { provide: getRepositoryToken(Suburb), useValue: suburbRepo },
      ],
    }).compile();

    service = module.get<LocationService>(LocationService);
  });

  afterEach(() => module.close());

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ── findStates ──────────────────────────────────────────────────────────────

  describe('findStates', () => {
    it('should return paginated states', async () => {
      const rows = [
        { id: 's1', name: 'New South Wales', code: 'NSW' },
        { id: 's2', name: 'Victoria', code: 'VIC' },
      ];
      stateRepo.createQueryBuilder.mockReturnValue(makeStateQb(rows, 2));

      const query: LocationQueryDto = { page: 1, limit: 10 } as any;
      const result = await service.findStates(query);

      expect(stateRepo.createQueryBuilder).toHaveBeenCalledWith('s');
      expect(result.total).toBe(2);
      expect(result.items).toEqual([
        { value: 's1', label: 'New South Wales' },
        { value: 's2', label: 'Victoria' },
      ]);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
    });

    it('should return empty items when no states exist', async () => {
      stateRepo.createQueryBuilder.mockReturnValue(makeStateQb([], 0));

      const result = await service.findStates({ page: 1, limit: 10 } as any);

      expect(result.items).toEqual([]);
      expect(result.total).toBe(0);
      expect(result.totalPages).toBe(0);
    });

    it('should apply search filter when search is provided', async () => {
      const qb = makeStateQb([{ id: 's1', name: 'New South Wales', code: 'NSW' }], 1);
      stateRepo.createQueryBuilder.mockReturnValue(qb);

      const query: LocationQueryDto = { page: 1, limit: 10, search: 'New' } as any;
      await service.findStates(query);

      expect(qb.where).toHaveBeenCalledWith(
        's.name ILIKE :search OR s.code ILIKE :search',
        { search: '%New%' },
      );
    });

    it('should not call where when search is not provided', async () => {
      const qb = makeStateQb([], 0);
      stateRepo.createQueryBuilder.mockReturnValue(qb);

      await service.findStates({ page: 1, limit: 10 } as any);

      expect(qb.where).not.toHaveBeenCalled();
    });

    it('should calculate totalPages correctly', async () => {
      stateRepo.createQueryBuilder.mockReturnValue(makeStateQb([], 25));

      const result = await service.findStates({ page: 1, limit: 10 } as any);

      expect(result.totalPages).toBe(3);
    });
  });

  // ── findSuburbs ─────────────────────────────────────────────────────────────

  describe('findSuburbs', () => {
    const suburbRows = [
      { id: 'c1', name: 'Surry Hills', postcode: '2010', stateId: 's1', state: { name: 'New South Wales', code: 'NSW' } },
      { id: 'c2', name: 'Newtown', postcode: '2042', stateId: 's1', state: { name: 'New South Wales', code: 'NSW' } },
    ];

    it('should return paginated suburbs with state info', async () => {
      suburbRepo.createQueryBuilder.mockReturnValue(makeSuburbQb(suburbRows, 2));

      const query: SuburbQueryDto = { page: 1, limit: 10 } as any;
      const result = await service.findSuburbs(query);

      expect(suburbRepo.createQueryBuilder).toHaveBeenCalledWith('s');
      expect(result.total).toBe(2);
      expect(result.items).toEqual([
        { value: 'c1', label: 'Surry Hills', postcode: '2010' },
        { value: 'c2', label: 'Newtown', postcode: '2042' },
      ]);
    });

    it('should return postcode as null for rows seeded before the column existed', async () => {
      suburbRepo.createQueryBuilder.mockReturnValue(
        makeSuburbQb([{ id: 'c9', name: 'Legacy Suburb', postcode: null, stateId: 's1' }], 1),
      );

      const result = await service.findSuburbs({ page: 1, limit: 10 } as any);

      expect(result.items).toEqual([{ value: 'c9', label: 'Legacy Suburb', postcode: null }]);
    });

    it('should keep same-named localities distinct by postcode', async () => {
      // "Back Creek" is six separate NSW localities; postcode is the only thing telling
      // them apart, so each must survive as its own option.
      const backCreeks = [
        { id: 'b1', name: 'Back Creek', postcode: '2372', stateId: 's1' },
        { id: 'b2', name: 'Back Creek', postcode: '2390', stateId: 's1' },
        { id: 'b3', name: 'Back Creek', postcode: '2422', stateId: 's1' },
      ];
      suburbRepo.createQueryBuilder.mockReturnValue(makeSuburbQb(backCreeks, 3));

      const result = await service.findSuburbs({ page: 1, limit: 10, search: 'Back Creek' } as any);

      expect(result.items).toEqual([
        { value: 'b1', label: 'Back Creek', postcode: '2372' },
        { value: 'b2', label: 'Back Creek', postcode: '2390' },
        { value: 'b3', label: 'Back Creek', postcode: '2422' },
      ]);
    });

    it('should order by name then postcode so paging over repeated names is stable', async () => {
      const qb = makeSuburbQb(suburbRows, 2);
      suburbRepo.createQueryBuilder.mockReturnValue(qb);

      await service.findSuburbs({ page: 1, limit: 10 } as any);

      expect(qb.orderBy).toHaveBeenCalledWith('s.name', 'ASC');
      expect(qb.addOrderBy).toHaveBeenCalledWith('s.postcode', 'ASC');
    });

    it('should select postcode', async () => {
      const qb = makeSuburbQb(suburbRows, 2);
      suburbRepo.createQueryBuilder.mockReturnValue(qb);

      await service.findSuburbs({ page: 1, limit: 10 } as any);

      expect(qb.select).toHaveBeenCalledWith(['s.id', 's.name', 's.postcode']);
    });

    it('should return empty items when no suburbs exist', async () => {
      suburbRepo.createQueryBuilder.mockReturnValue(makeSuburbQb([], 0));

      const result = await service.findSuburbs({ page: 1, limit: 10 } as any);

      expect(result.items).toEqual([]);
      expect(result.total).toBe(0);
    });

    it('should filter by stateId when provided', async () => {
      const qb = makeSuburbQb(suburbRows, 2);
      suburbRepo.createQueryBuilder.mockReturnValue(qb);

      const query: SuburbQueryDto = { page: 1, limit: 10, stateId: 's1' } as any;
      await service.findSuburbs(query);

      expect(qb.where).toHaveBeenCalledWith('s.state_id = :stateId', { stateId: 's1' });
    });

    it('should not filter by stateId when not provided', async () => {
      const qb = makeSuburbQb(suburbRows, 2);
      suburbRepo.createQueryBuilder.mockReturnValue(qb);

      await service.findSuburbs({ page: 1, limit: 10 } as any);

      const andWhereCalls: string[] = qb.andWhere.mock.calls.map((c: any[]) => c[0] as string);
      expect(andWhereCalls.some((s) => s.includes('state_id'))).toBe(false);
    });

    it('should apply search filter when search is provided', async () => {
      const qb = makeSuburbQb(suburbRows, 2);
      suburbRepo.createQueryBuilder.mockReturnValue(qb);

      const query: SuburbQueryDto = { page: 1, limit: 10, search: 'Surry' } as any;
      await service.findSuburbs(query);

      expect(qb.andWhere).toHaveBeenCalledWith(
        '(s.name ILIKE :search OR s.postcode LIKE :pcSearch)',
        { search: '%Surry%', pcSearch: 'Surry%' },
      );
    });

    it('should match a postcode typed into search', async () => {
      const qb = makeSuburbQb([suburbRows[0]], 1);
      suburbRepo.createQueryBuilder.mockReturnValue(qb);

      await service.findSuburbs({ page: 1, limit: 10, search: '2010' } as any);

      // Prefix-anchored on postcode so the index is usable, unlike the name's leading %.
      expect(qb.andWhere).toHaveBeenCalledWith(
        '(s.name ILIKE :search OR s.postcode LIKE :pcSearch)',
        { search: '%2010%', pcSearch: '2010%' },
      );
    });

    it('should apply both stateId and search filters together', async () => {
      const qb = makeSuburbQb([suburbRows[0]], 1);
      suburbRepo.createQueryBuilder.mockReturnValue(qb);

      const query: SuburbQueryDto = { page: 1, limit: 10, stateId: 's1', search: 'Surry' } as any;
      await service.findSuburbs(query);

      expect(qb.where).toHaveBeenCalledWith('s.state_id = :stateId', { stateId: 's1' });
      expect(qb.andWhere).toHaveBeenCalledWith(
        '(s.name ILIKE :search OR s.postcode LIKE :pcSearch)',
        { search: '%Surry%', pcSearch: 'Surry%' },
      );
    });

    it('should calculate totalPages correctly', async () => {
      suburbRepo.createQueryBuilder.mockReturnValue(makeSuburbQb([], 21));

      const result = await service.findSuburbs({ page: 1, limit: 10 } as any);

      expect(result.totalPages).toBe(3);
    });
  });
});
