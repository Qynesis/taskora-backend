import { registerAs } from '@nestjs/config';

export interface AppConfigType {
  nodeEnv: string;
  port: number;
  apiPrefix: string;
  logLevel: string;
  logPretty: boolean;
  corsOrigins: string[];
  corsCredentials: boolean;
}

export const appConfig = registerAs(
  'app',
  (): AppConfigType => ({
    // Comma-separated list, e.g. "http://localhost:5173,https://app.example.com"
    corsOrigins: (process.env['CORS_ORIGINS'] || '')
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean),
    corsCredentials: (process.env['CORS_CREDENTIALS'] || 'true').toLowerCase() === 'true',
    nodeEnv: process.env['NODE_ENV'] || 'development',
    port: parseInt(process.env['PORT'] || '3000', 10),
    apiPrefix: process.env['API_PREFIX'] || 'api',
    logLevel: process.env['LOG_LEVEL'] || 'info',
    logPretty: (process.env['LOG_PRETTY'] || 'false').toLowerCase() === 'true',
  }),
);
