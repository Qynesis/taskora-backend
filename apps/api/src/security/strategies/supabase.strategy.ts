import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Request } from 'express';
import { AuthenticatedUser } from '@app/shared-types';
import { IAuthStrategy } from '../interfaces/auth-strategy.interface';
import { SupabaseConfigType } from '../../config/namespaces/supabase.config';
import { User } from '../../database/entities/user.entity';

@Injectable()
export class SupabaseStrategy implements IAuthStrategy {
  private readonly supabase: SupabaseClient;

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(User) private readonly userRepository: Repository<User>,
  ) {
    const config = this.configService.get<SupabaseConfigType>('supabase')!;
    this.supabase = createClient(config.url, config.anonKey);
  }

  async validateToken(token: string): Promise<AuthenticatedUser> {
    const { data, error } = await this.supabase.auth.getUser(token);

    if (error || !data.user) {
      throw new UnauthorizedException('Invalid or expired Supabase token');
    }

    const { user } = data;

    // Enforced here rather than relying solely on Supabase's "Confirm email" project setting —
    // that toggle lives in the dashboard and can be turned off without any change to this repo,
    // which would silently let unverified addresses through. Checked before the DB lookup so an
    // unverified user gets the same response whether or not they have synced yet.
    if (!user.email_confirmed_at) {
      throw new UnauthorizedException('Please verify your email address');
    }

    // Reject non-usable accounts even if the Supabase token is still technically valid:
    //   - accountDeletedAt set → user-initiated deletion (permanent, anonymized)
    //   - deletedAt set        → admin suspend (soft-delete)
    //   - isActive === false   → admin deactivate (or the derived flag on a deleted account)
    // We look up withDeleted so a soft-deleted (suspended) row is still found and rejected. A missing
    // row means the user hasn't run the post-sign-in sync yet — allow it so first-time sync can create it.
    const dbUser = await this.userRepository.findOne({
      where: { id: user.id },
      withDeleted: true,
    });
    if (dbUser) {
      if (dbUser.accountDeletedAt) {
        throw new UnauthorizedException('This account has been deleted');
      }
      if (dbUser.deletedAt !== null || dbUser.isActive === false) {
        throw new UnauthorizedException('This account has been deactivated or suspended');
      }
    }
    const appRoles = user.app_metadata?.['roles'] as string[] | undefined;
    const metaRole = user.user_metadata?.['role'] as string | undefined;
    const roles: string[] = (appRoles?.length ? appRoles : metaRole ? [metaRole] : []).map((r) => r.toUpperCase());

    return {
      id: user.id,
      email: user.email ?? '',
      roles,
      metadata: user as unknown as Record<string, unknown>,
    };
  }

  extractToken(request: Request): string | null {
    const authorization = request.headers.authorization;
    if (!authorization) return null;

    const [scheme, token] = authorization.split(' ');
    if (scheme !== 'Bearer' || !token) return null;

    return token;
  }
}
