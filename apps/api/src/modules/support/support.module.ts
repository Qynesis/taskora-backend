import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SupportTicket } from '../../database/entities/support-ticket.entity';
import { SupportMessage } from '../../database/entities/support-message.entity';
import { SupportTicketService } from './support-ticket.service';
import { SupportTicketController } from './support-ticket.controller';
import { SupportMessageCreatedHandler } from './events/support-message-created.handler';
import { DatabaseModule } from '../../database/database.module';
import { EventsModule } from '../../events/events.module';
import { SecurityModule } from '../../security/security.module';
import { CacheInterceptor } from '../../cache/cache.interceptor';
import { MessageModule } from '../messages/message.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([SupportTicket, SupportMessage]),
    DatabaseModule,
    EventsModule,
    SecurityModule,
    MessageModule,
  ],
  controllers: [SupportTicketController],
  providers: [
    SupportTicketService,
    SupportMessageCreatedHandler,
    CacheInterceptor,
  ],
  exports: [SupportTicketService],
})
export class SupportModule {}
