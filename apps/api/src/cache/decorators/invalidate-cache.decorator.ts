import { SetMetadata } from '@nestjs/common';
import { Request } from 'express';

export const INVALIDATE_CACHE_KEY = 'invalidateCache';

export type InvalidateCacheKeyFactory = (req: Request, response: any) => string;
export type InvalidateCacheKey = string | InvalidateCacheKeyFactory;

/**
 * Clears specific cache keys after a mutation handler completes successfully.
 * Accepts static strings or factory functions resolved at runtime.
 *
 * Factory signature: (req, response) => string
 * Use the response object to derive keys when the identifier is only known
 * after the handler executes (e.g. a providerId returned in the created entity).
 *
 * @param keys - Cache keys or factory functions to invalidate after the handler succeeds.
 */
export const InvalidateCache = (...keys: InvalidateCacheKey[]) => SetMetadata(INVALIDATE_CACHE_KEY, keys);
