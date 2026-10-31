import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditLog } from '../../database/entities/audit-log.entity';
import { AuditService } from './audit.service';
import { AuditController } from './audit.controller';
import { AuditEventListener } from './audit-event.listener';
import { EventsModule } from '../../events/events.module';
import { SecurityModule } from '../../security/security.module';
import { CacheInterceptor } from '../../cache/cache.interceptor';

@Module({
  imports: [
    TypeOrmModule.forFeature([AuditLog]),
    EventsModule,
    SecurityModule,
  ],
  controllers: [AuditController],
  providers: [AuditService, AuditEventListener, CacheInterceptor],
  exports: [AuditService],
})
export class AuditModule {}
