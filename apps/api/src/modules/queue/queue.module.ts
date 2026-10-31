import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigService } from '@nestjs/config';
import { RedisConfigType } from '../../config/namespaces/redis.config';
import { QueueConfigType } from '../../config/namespaces/queue.config';
import { QUEUE_NAMES } from '@app/shared-types';

/**
 * Queue producers for the API. Consumers live in apps/worker.
 *
 * Only queues that are actually produced to are registered here. The template's example /
 * emails / reports / subscription-webhooks queues were removed: nothing ever dispatched to
 * them and every processor was a stub, so they amounted to four idle Redis subscriptions and a
 * standing invitation to assume background work existed when it did not.
 */
@Module({
  imports: [
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const redis = configService.get<RedisConfigType>('redis')!;
        const useTls = redis.host.includes('upstash.io') || process.env['REDIS_TLS'] === 'true';
        return {
          connection: {
            host: redis.host,
            port: redis.port,
            password: redis.password || undefined,
            tls: useTls ? {} : undefined,
            maxRetriesPerRequest: null,
          },
        };
      },
    }),
    BullModule.registerQueueAsync({
      name: QUEUE_NAMES.PROVIDER_STATS,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const queue = configService.get<QueueConfigType>('queue')!;
        return {
          defaultJobOptions: {
            attempts: queue.defaultAttempts,
            backoff: { type: 'exponential', delay: queue.defaultBackoff },
            removeOnComplete: true,
            removeOnFail: false,
          },
        };
      },
    }),
  ],
  exports: [BullModule],
})
export class QueueModule {}
