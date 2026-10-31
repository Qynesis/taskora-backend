import { registerAs } from '@nestjs/config';

export interface AuthConfigType {
  jwtSecret: string;
  jwtExpiration: string;
  jwtAccessSecret: string;
  jwtRefreshSecret: string;
  jwtAccessExpiry: string;
  jwtRefreshExpiry: string;
}

export const authConfig = registerAs(
  'auth',
  (): AuthConfigType => ({
    jwtSecret: process.env['JWT_SECRET'] || 'change-me',
    jwtExpiration: process.env['JWT_EXPIRATION'] || '1h',
    jwtAccessSecret: process.env['JWT_ACCESS_SECRET'] || process.env['JWT_SECRET'] || 'change-me',
    jwtRefreshSecret: process.env['JWT_REFRESH_SECRET'] || 'change-me-refresh',
    jwtAccessExpiry: process.env['JWT_ACCESS_EXPIRY'] || '15m',
    jwtRefreshExpiry: process.env['JWT_REFRESH_EXPIRY'] || '30d',
  }),
);
