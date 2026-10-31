import { Request } from 'express';
import { AuthenticatedUser } from '@app/shared-types';

/**
 * Provider-agnostic auth strategy interface.
 *
 * To swap authentication providers (e.g., from JWT to Supabase or Firebase),
 * implement this interface and register it with the AUTH_STRATEGY token:
 *
 *   // In your module providers:
 *   { provide: AUTH_STRATEGY, useClass: SupabaseStrategy }
 *
 * No other code changes are needed — JwtAuthGuard calls this interface,
 * not a concrete implementation.
 */
export interface IAuthStrategy {
  validateToken(token: string): Promise<AuthenticatedUser>;
  extractToken(request: Request): string | null;
}

export const AUTH_STRATEGY = Symbol('AUTH_STRATEGY');
