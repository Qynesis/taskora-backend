import { registerAs } from '@nestjs/config';

export interface SupabaseConfigType {
  url: string;
  anonKey: string;
  /** Service-role key — required only for admin operations (e.g. deleting an auth user on account deletion). */
  serviceRoleKey: string;
}

export const supabaseConfig = registerAs(
  'supabase',
  (): SupabaseConfigType => ({
    url: process.env['SUPABASE_URL'] ?? '',
    anonKey: process.env['SUPABASE_ANON_KEY'] ?? '',
    serviceRoleKey: process.env['SUPABASE_SERVICE_ROLE_KEY'] ?? '',
  }),
);
