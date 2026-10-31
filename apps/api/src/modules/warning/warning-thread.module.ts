import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WarningThread } from '../../database/entities/warning-thread.entity';
import { WarningMessage } from '../../database/entities/warning-message.entity';
import { UserWarning } from '../../database/entities/user-warning.entity';
import { WarningThreadService } from './warning-thread.service';
import { WarningThreadController } from './warning-thread.controller';
import { WarningMessageCreatedHandler } from './events/warning-message-created.handler';
import { ReportStatusChangedHandler } from './events/report-status-changed.handler';
import { DatabaseModule } from '../../database/database.module';
import { EventsModule } from '../../events/events.module';
import { SecurityModule } from '../../security/security.module';
import { CacheInterceptor } from '../../cache/cache.interceptor';
import { MessageModule } from '../messages/message.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([WarningThread, WarningMessage, UserWarning]),
    DatabaseModule,
    EventsModule,
    SecurityModule,
    MessageModule,
  ],
  controllers: [WarningThreadController],
  providers: [
    WarningThreadService,
    WarningMessageCreatedHandler,
    ReportStatusChangedHandler,
    CacheInterceptor,
  ],
  exports: [WarningThreadService],
})
export class WarningThreadModule {}
