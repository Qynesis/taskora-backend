import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Bid } from '../../database/entities/bid.entity';
import { Job } from '../../database/entities/job.entity';
import { BidService } from './bid.service';
import { BidController } from './bid.controller';
import { BidCreatedHandler } from './events/bid-created.handler';
import { DatabaseModule } from '../../database/database.module';
import { EventsModule } from '../../events/events.module';
import { SecurityModule } from '../../security/security.module';
import { CacheInterceptor } from '../../cache/cache.interceptor';

@Module({
  imports: [
    TypeOrmModule.forFeature([Bid, Job]),
    DatabaseModule,
    EventsModule,
    SecurityModule,
  ],
  controllers: [BidController],
  providers: [BidService, BidCreatedHandler, CacheInterceptor],
  exports: [BidService],
})
export class BidModule {}
