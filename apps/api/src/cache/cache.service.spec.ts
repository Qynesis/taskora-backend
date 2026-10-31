import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { AppCacheService } from './cache.service';

const mockRedis = {
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
  scan: jest.fn(),
  flushdb: jest.fn(),
  quit: jest.fn(),
};

jest.mock('ioredis', () => jest.fn(() => mockRedis));

const mockConfigService = {
  get: jest.fn((key: string) => {
    if (key === 'redis') return { host: 'localhost', port: 6379, password: null };
    if (key === 'cache') return { defaultTtl: 60, maxItems: 100 };
    return undefined;
  }),
};

describe('AppCacheService', () => {
  let service: AppCacheService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppCacheService,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<AppCacheService>(AppCacheService);
  });

  afterEach(() => service.onModuleDestroy());

  describe('get', () => {
    it('should return parsed value on hit', async () => {
      mockRedis.get.mockResolvedValue(JSON.stringify({ id: 1, name: 'cached' }));

      const result = await service.get<{ id: number; name: string }>('test-key');

      expect(result).toEqual({ id: 1, name: 'cached' });
      expect(mockRedis.get).toHaveBeenCalledWith('test-key');
    });

    it('should return null on cache miss', async () => {
      mockRedis.get.mockResolvedValue(null);

      const result = await service.get('missing-key');

      expect(result).toBeNull();
    });
  });

  describe('set', () => {
    it('should set value with default TTL when no ttl provided', async () => {
      await service.set('key', { data: 'value' });

      expect(mockRedis.set).toHaveBeenCalledWith('key', JSON.stringify({ data: 'value' }), 'PX', 60000);
    });

    it('should set value with custom TTL converted to ms', async () => {
      await service.set('key', { data: 'value' }, 120);

      expect(mockRedis.set).toHaveBeenCalledWith('key', JSON.stringify({ data: 'value' }), 'PX', 120000);
    });
  });

  describe('del', () => {
    it('should delete a cache key', async () => {
      await service.del('key');

      expect(mockRedis.del).toHaveBeenCalledWith('key');
    });
  });

  describe('delByPrefix', () => {
    it('should delete all keys matching prefix', async () => {
      mockRedis.scan
        .mockResolvedValueOnce(['0', ['prefix:a', 'prefix:b']]);

      await service.delByPrefix('prefix:');

      expect(mockRedis.del).toHaveBeenCalledWith('prefix:a', 'prefix:b');
    });

    it('should warn when no keys matched', async () => {
      mockRedis.scan.mockResolvedValueOnce(['0', []]);
      const warnSpy = jest.spyOn(service['logger'], 'warn');

      await service.delByPrefix('nonexistent:');

      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('no keys matched'));
    });
  });

  describe('reset', () => {
    it('should flush all cache', async () => {
      await service.reset();

      expect(mockRedis.flushdb).toHaveBeenCalled();
    });
  });
});
