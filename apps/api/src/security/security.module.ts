import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AUTH_STRATEGY, IAuthStrategy } from './interfaces/auth-strategy.interface';
import { SupabaseStrategy } from './strategies/supabase.strategy';
import { DevBypassStrategy } from './strategies/dev-bypass.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { PermissionsGuard } from './rbac/permissions.guard';
import { User } from '../database/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  providers: [
    SupabaseStrategy,
    DevBypassStrategy,
    {
      provide: AUTH_STRATEGY,
      useFactory: (config: ConfigService, supabase: SupabaseStrategy, dev: DevBypassStrategy): IAuthStrategy => {
        const bypassValue = config.get<boolean | string>('AUTH_BYPASS');
        const bypass = bypassValue === true || String(bypassValue).trim().toLowerCase() === 'true';
        const isProduction = config.get<string>('NODE_ENV') === 'production';

        if (bypass && isProduction) {
          throw new Error('AUTH_BYPASS must not be enabled in production');
        }

        return bypass ? dev : supabase;
      },
      inject: [ConfigService, SupabaseStrategy, DevBypassStrategy],
    },
    JwtAuthGuard,
    RolesGuard,
    PermissionsGuard,
  ],
  exports: [AUTH_STRATEGY, JwtAuthGuard, RolesGuard, PermissionsGuard],
})
export class SecurityModule {}
