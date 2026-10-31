import { Test, TestingModule } from '@nestjs/testing';
import { LocationController } from './location.controller';
import { LocationService } from './location.service';
import { PaginatedResponseDto } from '../../interfaces/paginated-response.dto';
import { LocationOptionDto } from './dto/location-response.dto';
import { LocationQueryDto, SuburbQueryDto } from './dto/location-query.dto';

const paginatedStates = new PaginatedResponseDto<LocationOptionDto>(
  [
    { value: 's1', label: 'New South Wales' },
    { value: 's2', label: 'Victoria' },
  ],
  2,
  1,
  10,
);

const paginatedSuburbs = new PaginatedResponseDto<LocationOptionDto>(
  [
    { value: 'c1', label: 'Surry Hills' },
    { value: 'c2', label: 'Fitzroy' },
  ],
  2,
  1,
  10,
);

describe('LocationController', () => {
  let controller: LocationController;
  let service: { findStates: jest.Mock; findSuburbs: jest.Mock };

  beforeEach(async () => {
    service = { findStates: jest.fn(), findSuburbs: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [LocationController],
      providers: [{ provide: LocationService, useValue: service }],
    })
      .useMocker((_token) =>
        new Proxy({}, { get: (_t, p) => (p === 'then' ? undefined : jest.fn()) }),
      )
      .compile();

    controller = module.get<LocationController>(LocationController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // ── findStates ──────────────────────────────────────────────────────────────

  describe('findStates', () => {
    it('should delegate to LocationService.findStates and return the result', async () => {
      service.findStates.mockResolvedValue(paginatedStates);

      const result = await controller.findStates({ page: 1, limit: 10 } as LocationQueryDto);

      expect(service.findStates).toHaveBeenCalledWith(expect.any(Object));
      expect(result).toBe(paginatedStates);
    });

    it('should pass the full query object to the service', async () => {
      service.findStates.mockResolvedValue(paginatedStates);
      const query: LocationQueryDto = { page: 2, limit: 5, search: 'New' } as any;

      await controller.findStates(query);

      expect(service.findStates).toHaveBeenCalledWith(query);
    });

    it('should return empty paginated result when service returns no states', async () => {
      const empty = new PaginatedResponseDto<LocationOptionDto>([], 0, 1, 10);
      service.findStates.mockResolvedValue(empty);

      const result = await controller.findStates({ page: 1, limit: 10 } as any);

      expect(result.items).toEqual([]);
      expect(result.total).toBe(0);
    });
  });

  // ── findSuburbs ─────────────────────────────────────────────────────────────

  describe('findSuburbs', () => {
    it('should delegate to LocationService.findSuburbs and return the result', async () => {
      service.findSuburbs.mockResolvedValue(paginatedSuburbs);

      const result = await controller.findSuburbs({ page: 1, limit: 10 } as SuburbQueryDto);

      expect(service.findSuburbs).toHaveBeenCalledWith(expect.any(Object));
      expect(result).toBe(paginatedSuburbs);
    });

    it('should pass the full query (including stateId) to the service', async () => {
      service.findSuburbs.mockResolvedValue(paginatedSuburbs);
      const query: SuburbQueryDto = { page: 1, limit: 10, stateId: 's1', search: 'Surry' } as any;

      await controller.findSuburbs(query);

      expect(service.findSuburbs).toHaveBeenCalledWith(query);
    });

    it('should return empty paginated result when service returns no suburbs', async () => {
      const empty = new PaginatedResponseDto<LocationOptionDto>([], 0, 1, 10);
      service.findSuburbs.mockResolvedValue(empty);

      const result = await controller.findSuburbs({ page: 1, limit: 10 } as any);

      expect(result.items).toEqual([]);
      expect(result.total).toBe(0);
    });
  });
});
