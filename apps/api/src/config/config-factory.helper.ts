import { ConfigService } from '@nestjs/config';

/**
 * Type-safe config accessor. Retrieves a typed config namespace from ConfigService.
 *
 * Usage:
 *   const dbConfig = configFactory<DatabaseConfigType>(configService, 'database');
 *   console.log(dbConfig.host);
 */
export function configFactory<T extends Record<string, unknown>>(
  configService: ConfigService,
  namespace: string,
): T {
  const config = configService.get<T>(namespace);
  if (!config) {
    throw new Error(`Configuration namespace "${namespace}" is not registered`);
  }
  return config;
}
