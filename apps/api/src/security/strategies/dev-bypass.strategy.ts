import { Injectable } from '@nestjs/common';
import { Request } from 'express';
import { AuthenticatedUser } from '@app/shared-types';
import { IAuthStrategy } from '../interfaces/auth-strategy.interface';

/**
 * Development-only auth bypass strategy.
 *
 * Skips token validation entirely. Mock user is built from request headers:
 *   X-Dev-User-Id    — defaults to a fixed UUID
 *   X-Dev-User-Email — defaults to "dev@local.test"
 *   X-Dev-User-Role  — defaults to "seeker"
 *
 * Enable via AUTH_BYPASS=true in your .env file.
 * Never use in production.
 */
@Injectable()
export class DevBypassStrategy implements IAuthStrategy {
  private static readonly DEFAULT_ID = '00000000-0000-0000-0000-000000000001';
  private static readonly DEFAULT_EMAIL = 'dev@local.test';
  private static readonly DEFAULT_ROLE = 'seeker';

  extractToken(request: Request): string | null {
    const id = (request.headers['x-dev-user-id'] as string | undefined) ?? DevBypassStrategy.DEFAULT_ID;
    const email = (request.headers['x-dev-user-email'] as string | undefined) ?? DevBypassStrategy.DEFAULT_EMAIL;
    const role = (request.headers['x-dev-user-role'] as string | undefined) ?? DevBypassStrategy.DEFAULT_ROLE;

    // Encode mock user into the token so validateToken can reconstruct it
    return JSON.stringify({ id, email, role });
  }

  async validateToken(token: string): Promise<AuthenticatedUser> {
    const { id, email, role } = JSON.parse(token) as { id: string; email: string; role: string };
    return { id, email, roles: [role.toUpperCase()], metadata: {} };
  }
}
