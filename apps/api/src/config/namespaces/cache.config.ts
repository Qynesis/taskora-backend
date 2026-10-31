import { registerAs } from '@nestjs/config';

export interface CacheConfigType {
  defaultTtl: number;
  maxItems: number;
}

export const cacheConfig = registerAs(
  'cache',
  (): CacheConfigType => ({
    defaultTtl: parseInt(process.env['CACHE_DEFAULT_TTL'] || '60', 10),
    maxItems: parseInt(process.env['CACHE_MAX_ITEMS'] || '1000', 10),
  }),
);
