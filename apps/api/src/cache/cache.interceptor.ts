import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { Observable, mergeMap, of, tap } from 'rxjs';
import { Request } from 'express';
import { AppCacheService } from './cache.service';
import { CACHED_KEY, CachedMetadata } from './decorators/cached.decorator';
import { CACHE_KEY_META, CacheKeyFactory } from './decorators/cache-key.decorator';
import { INVALIDATE_CACHE_KEY, InvalidateCacheKey } from './decorators/invalidate-cache.decorator';
import { CacheConfigType } from '../config/namespaces/cache.config';

@Injectable()
export class CacheInterceptor implements NestInterceptor {
  private readonly logger = new Logger(CacheInterceptor.name);
  private readonly defaultTtl: number;

  constructor(
    private readonly reflector: Reflector,
    private readonly cacheService: AppCacheService,
    private readonly configService: ConfigService,
  ) {
    const cacheConfig = this.configService.get<CacheConfigType>('cache');
    this.defaultTtl = cacheConfig?.defaultTtl ?? 60;
  }

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<unknown>> {
    const request = context.switchToHttp().getRequest<Request>();
    const userId: string = (request as any).user?.id ?? 'anonymous';

    // Handle @InvalidateCache — run after handler, then delete keys
    const invalidateKeys = this.reflector.getAllAndOverride<InvalidateCacheKey[] | undefined>(
      INVALIDATE_CACHE_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (invalidateKeys && invalidateKeys.length > 0) {
      return next.handle().pipe(
        mergeMap(async (response) => {
          for (const key of invalidateKeys) {
            const resolvedKey = typeof key === 'function' ? key(request, response) : key;
            if (resolvedKey.endsWith('*')) {
              this.logger.log(`[CACHE INVALIDATED] userId=${userId} prefix="${resolvedKey}"`);
              await this.cacheService.delByPrefix(resolvedKey.slice(0, -1));
            } else {
              this.logger.log(`[CACHE INVALIDATED] userId=${userId} key="${resolvedKey}"`);
              await this.cacheService.del(resolvedKey);
            }
          }
          return response;
        }),
      );
    }

    // Handle @Cached — check cache first, store on miss
    const cachedMeta = this.reflector.getAllAndOverride<CachedMetadata | undefined>(CACHED_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!cachedMeta) {
      return next.handle();
    }

    const explicitKey = this.reflector.getAllAndOverride<string | CacheKeyFactory | undefined>(CACHE_KEY_META, [
      context.getHandler(),
      context.getClass(),
    ]);
    const cacheKey = typeof explicitKey === 'function' ? explicitKey(request) : (explicitKey || request.originalUrl);
    const ttl = cachedMeta.ttl ?? this.defaultTtl;

    const cached = await this.cacheService.get<unknown>(cacheKey);
    if (cached !== null) {
      this.logger.log(`[CACHE HIT] userId=${userId} key="${cacheKey}"`);
      return of(cached);
    }

    this.logger.log(`[CACHE MISS] userId=${userId} key="${cacheKey}"`);
    return next.handle().pipe(
      tap(async (response) => {
        await this.cacheService.set(cacheKey, response, ttl);
      }),
    );
  }
}
