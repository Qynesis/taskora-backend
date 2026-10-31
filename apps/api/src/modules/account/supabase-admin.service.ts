import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { SupabaseConfigType } from '../../config/namespaces/supabase.config';

/**
 * Thin wrapper around a service-role Supabase client for admin-only operations.
 *
 * The normal auth flow uses the anon key (see SupabaseStrategy); those operations can never
 * touch other users. Deleting a user's auth identity requires the service-role key, which is
 * privileged and must only ever live server-side. If the key is not configured we degrade
 * gracefully (log + no-op) so local/dev environments without it still work — the DB-level
 * auth gate still blocks the deleted user regardless.
 */
@Injectable()
export class SupabaseAdminService {
  private readonly logger = new Logger(SupabaseAdminService.name);
  private readonly admin: SupabaseClient | null;

  constructor(private readonly configService: ConfigService) {
    const config = this.configService.get<SupabaseConfigType>('supabase')!;
    this.admin = config.serviceRoleKey
      ? createClient(config.url, config.serviceRoleKey, {
          auth: { autoRefreshToken: false, persistSession: false },
        })
      : null;

    if (!this.admin) {
      this.logger.warn(
        'SUPABASE_SERVICE_ROLE_KEY is not configured — auth-user deletion will be skipped. ' +
          'Deleted users are still blocked at the DB auth gate, but their Supabase auth identity ' +
          'and email will not be freed until the key is provided.',
      );
    }
  }

  /**
   * Permanently deletes the Supabase auth user, revoking their ability to log in and freeing
   * the email for re-registration. Best-effort: never throws, so a Supabase-side failure cannot
   * block the user's account-deletion request (the DB row is already soft-deleted + anonymized).
   */
  async deleteAuthUser(userId: string): Promise<void> {
    if (!this.admin) return;
    try {
      const { error } = await this.admin.auth.admin.deleteUser(userId);
      if (error) {
        this.logger.warn(`Failed to delete Supabase auth user ${userId}: ${error.message}`);
        return;
      }
      this.logger.log(`Deleted Supabase auth user ${userId}`);
    } catch (error) {
      this.logger.warn(`Error deleting Supabase auth user ${userId}: ${(error as Error).message}`);
    }
  }
}
