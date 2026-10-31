import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './health.controller';
import { DevController } from './dev.controller';
import { RedisHealthIndicator } from './redis.health';
import { SecurityModule } from '../../security/security.module';

@Module({
  imports: [TerminusModule, SecurityModule],
  controllers: [HealthController, DevController],
  providers: [RedisHealthIndicator],
})
export class HealthModule {}
