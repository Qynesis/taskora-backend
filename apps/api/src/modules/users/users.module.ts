import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../../database/entities/user.entity';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { UserSyncedHandler } from './events/user-synced.handler';
import { DatabaseModule } from '../../database/database.module';
import { EventsModule } from '../../events/events.module';
import { SecurityModule } from '../../security/security.module';
import { CacheInterceptor } from '../../cache/cache.interceptor';
import { UserNotificationSettings } from '../../database/entities/user_notification_settings.entity';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, UserNotificationSettings]),
    DatabaseModule,
    EventsModule,
    SecurityModule,
    AuditModule,
  ],
  controllers: [UsersController],
  providers: [UsersService, UserSyncedHandler, CacheInterceptor],
  exports: [UsersService],
})
export class UsersModule {}
