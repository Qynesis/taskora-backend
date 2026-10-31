import { SetMetadata } from '@nestjs/common';
import { Request } from 'express';

export const CACHE_KEY_META = 'cacheKey';

export type CacheKeyFactory = (req: Request) => string;

/**
 * Explicitly sets the cache key for a handler. Used with @Cached().
 * If not provided, the cache key is derived from the request URL.
 *
 * Accepts a static string or a factory function for dynamic keys.
 * Keys should follow the pattern: <module>:<resource>:<identifier>
 * e.g. "reviews:provider:uuid"
 */
export const CacheKey = (key: string | CacheKeyFactory) => SetMetadata(CACHE_KEY_META, key);
