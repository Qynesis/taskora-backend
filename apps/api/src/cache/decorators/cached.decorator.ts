import { SetMetadata } from '@nestjs/common';

export const CACHED_KEY = 'cached';

export interface CachedMetadata {
  ttl?: number;
}

/**
 * Caches a controller handler's response automatically.
 * TTL defaults to CACHE_DEFAULT_TTL env var (in seconds).
 *
 * Only use on GET/read endpoints — never cache mutation responses.
 *
 * @param ttl - Cache time-to-live in seconds. Omit to use the default.
 */
export const Cached = (ttl?: number) => SetMetadata(CACHED_KEY, { ttl } as CachedMetadata);
