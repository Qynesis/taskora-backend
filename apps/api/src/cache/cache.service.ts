import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { RedisConfigType } from '../config/namespaces/redis.config';
import { CacheConfigType } from '../config/namespaces/cache.config';

@Injectable()
export class AppCacheService implements OnModuleDestroy {
  private readonly logger = new Logger(AppCacheService.name);
  private readonly redisClient: Redis;
  private readonly defaultTtlMs: number;

  constructor(configService: ConfigService) {
    const redis = configService.get<RedisConfigType>('redis')!;
    const cache = configService.get<CacheConfigType>('cache')!;
    this.defaultTtlMs = cache.defaultTtl * 1000;
    const useTls = redis.host.includes('upstash.io') || process.env['REDIS_TLS'] === 'true';
    this.redisClient = new Redis({
      host: redis.host,
      port: redis.port,
      password: redis.password || undefined,
      tls: useTls ? {} : undefined,
      maxRetriesPerRequest: null,
    });
  }

  async onModuleDestroy(): Promise<void> {
    await this.redisClient.quit();
  }

  async get<T>(key: string): Promise<T | null> {
    const value = await this.redisClient.get(key);
    if (value === null) return null;
    return JSON.parse(value) as T;
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    this.logger.log(`[CACHE SET] key="${key}"`);
    const ttlMs = ttl !== undefined ? ttl * 1000 : this.defaultTtlMs;
    if (ttlMs > 0) {
      await this.redisClient.set(key, JSON.stringify(value), 'PX', ttlMs);
    } else {
      await this.redisClient.set(key, JSON.stringify(value));
    }
  }

  async del(key: string): Promise<void> {
    await this.redisClient.del(key);
  }

  async delByPrefix(prefix: string): Promise<void> {
    this.logger.log(`[CACHE SCAN] pattern="${prefix}*"`);
    let totalDeleted = 0;
    let cursor = '0';
    do {
      const [nextCursor, keys] = await this.redisClient.scan(cursor, 'MATCH', `${prefix}*`, 'COUNT', 200);
      cursor = nextCursor;
      if (keys.length > 0) {
        await this.redisClient.del(...keys);
        totalDeleted += keys.length;
        this.logger.log(`[CACHE DEL] keys=[${keys.join(', ')}]`);
      }
    } while (cursor !== '0');
    if (totalDeleted === 0) {
      this.logger.warn(`[CACHE DEL] no keys matched pattern="${prefix}*"`);
    }
  }

  async reset(): Promise<void> {
    await this.redisClient.flushdb();
  }
}
