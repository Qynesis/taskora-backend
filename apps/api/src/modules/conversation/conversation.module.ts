import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Conversation } from '../../database/entities/conversation.entity';
import { DirectMessage } from '../../database/entities/direct-message.entity';
import { Job } from '../../database/entities/job.entity';
import { User } from '../../database/entities/user.entity';
import { ConversationService } from './conversation.service';
import { ConversationController } from './conversation.controller';
import { MessageModerationService } from './message-moderation.service';
import { BidPlacedHandler } from './events/bid-placed.handler';
import { BidUpdatedHandler } from './events/bid-updated.handler';
import { DirectMessageCreatedHandler } from './events/direct-message-created.handler';
import { MessageModule } from '../messages/message.module';
import { EventsModule } from '../../events/events.module';
import { SecurityModule } from '../../security/security.module';
import { CacheInterceptor } from '../../cache/cache.interceptor';

@Module({
  imports: [
    TypeOrmModule.forFeature([Conversation, DirectMessage, Job, User]),
    MessageModule,
    EventsModule,
    SecurityModule,
  ],
  controllers: [ConversationController],
  providers: [
    ConversationService,
    MessageModerationService,
    BidPlacedHandler,
    BidUpdatedHandler,
    DirectMessageCreatedHandler,
    CacheInterceptor,
  ],
  exports: [ConversationService],
})
export class ConversationModule {}
