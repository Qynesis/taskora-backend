import { Controller, Get } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckService,
  HealthCheckResult,
} from '@nestjs/terminus';
import { WorkerRedisHealthIndicator } from './worker-redis.health';

@Controller('health')
export class WorkerHealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly redis: WorkerRedisHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  check(): Promise<HealthCheckResult> {
    return this.health.check([() => this.redis.isHealthy('redis')]);
  }
}
