import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { WorkerHealthController } from './worker-health.controller';
import { WorkerRedisHealthIndicator } from './worker-redis.health';

@Module({
  imports: [TerminusModule],
  controllers: [WorkerHealthController],
  providers: [WorkerRedisHealthIndicator],
})
export class WorkerHealthModule {}
