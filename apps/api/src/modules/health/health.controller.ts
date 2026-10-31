import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import {
  HealthCheck,
  HealthCheckService,
  TypeOrmHealthIndicator,
  MemoryHealthIndicator,
  HealthCheckResult,
} from '@nestjs/terminus';
import { SkipTransform } from '../../http/interceptors/transform.interceptor';
import { ResponseMessage } from '../../http/decorators/response-message.decorator';
import { RedisHealthIndicator } from './redis.health';
import { HealthCheckResponseDto } from './dto/health-check-response.dto';

@SkipThrottle() // Docker healthcheck probes must not be rate-limited
@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly db: TypeOrmHealthIndicator,
    private readonly memory: MemoryHealthIndicator,
    private readonly redis: RedisHealthIndicator,
  ) {}

  @Get()
  @SkipTransform()
  @HealthCheck()
  @ResponseMessage('Application health status fetched successfully')
  @ApiOperation({ summary: 'Application health check' })
  @ApiResponse({ status: 200, description: 'Application health status', type: HealthCheckResponseDto })
  check(): Promise<HealthCheckResult> {
    return this.health.check([
      () => this.db.pingCheck('database'),
      () => this.redis.isHealthy('redis'),
      () => this.memory.checkHeap('memory_heap', 256 * 1024 * 1024), // 256MB
    ]);
  }
}
