import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { LoggerModule } from 'nestjs-pino';
import { QUEUE_NAMES } from '@app/shared-types';
import { ProviderStatsProcessor } from './queues/provider-stats.queue';
import { WorkerDbModule } from './database/worker-db.module';
import { WorkerHealthModule } from './health/worker-health.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    LoggerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const isDev = configService.get('NODE_ENV') === 'development';
        const logPretty = String(configService.get('LOG_PRETTY', 'false')).toLowerCase() === 'true';
        return {
          pinoHttp: {
            level: configService.get('LOG_LEVEL', 'info'),
            transport:
              isDev || logPretty ? { target: 'pino-pretty', options: { colorize: true } } : undefined,
          },
        };
      },
    }),
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const host = configService.get('REDIS_HOST', 'localhost');
        const useTls = host.includes('upstash.io') || configService.get('REDIS_TLS') === 'true';
        return {
          connection: {
            host,
            port: configService.get<number>('REDIS_PORT', 6379),
            password: configService.get('REDIS_PASSWORD') || undefined,
            tls: useTls ? {} : undefined,
            maxRetriesPerRequest: null,
          },
        };
      },
    }),
    BullModule.registerQueue({ name: QUEUE_NAMES.PROVIDER_STATS }),
    // Its own TypeORM connection — the API's DatabaseModule lives outside this app's tsconfig
    // scope, so it is configured inline from DB_* rather than imported.
    WorkerDbModule,
    WorkerHealthModule,
  ],
  providers: [ProviderStatsProcessor],
})
export class WorkerModule {}
