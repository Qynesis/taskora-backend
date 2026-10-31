import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Review } from '../../database/entities/review.entity';
import { Job } from '../../database/entities/job.entity';
import { ProviderRatingSummary } from '../../database/entities/provider_rating_summary.entity';
import { ReviewService } from './review.service';
import { ReviewController } from './review.controller';
import { DatabaseModule } from '../../database/database.module';
import { EventsModule } from '../../events/events.module';
import { SecurityModule } from '../../security/security.module';
import { CacheInterceptor } from '../../cache/cache.interceptor';

@Module({
  imports: [
    TypeOrmModule.forFeature([Review, Job, ProviderRatingSummary]),
    DatabaseModule,
    // ReviewService emits ReviewCreatedEvent, which ProviderStatsListener turns into a stats
    // recompute. EventsModule is not @Global, so it has to be imported here.
    EventsModule,
    SecurityModule,
  ],
  controllers: [ReviewController],
  providers: [ReviewService, CacheInterceptor],
  exports: [ReviewService],
})
export class ReviewModule {}
