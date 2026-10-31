import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserReport } from '../../database/entities/user-report.entity';
import { User } from '../../database/entities/user.entity';
import { UserWarning } from '../../database/entities/user-warning.entity';
import { WarningThread } from '../../database/entities/warning-thread.entity';
import { ReportService } from './report.service';
import { ReportController } from './report.controller';
import { ReportCreatedHandler } from './events/report-created.handler';
import { DatabaseModule } from '../../database/database.module';
import { EventsModule } from '../../events/events.module';
import { SecurityModule } from '../../security/security.module';
import { CacheInterceptor } from '../../cache/cache.interceptor';
import { WarningThreadModule } from '../warning/warning-thread.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserReport, User, UserWarning, WarningThread]),
    DatabaseModule,
    EventsModule,
    SecurityModule,
    WarningThreadModule,
  ],
  controllers: [ReportController],
  providers: [ReportService, ReportCreatedHandler, CacheInterceptor],
  exports: [ReportService],
})
export class ReportModule {}
