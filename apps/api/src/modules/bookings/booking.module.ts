import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Job } from '../../database/entities/job.entity';
import { JobPhoto } from '../../database/entities/job-photo.entity';
import { Conversation } from '../../database/entities/conversation.entity';
import { BookingService } from './booking.service';
import { BookingController } from './booking.controller';
import { BookingCreatedHandler } from './events/booking-created.handler';
import { DatabaseModule } from '../../database/database.module';
import { EventsModule } from '../../events/events.module';
import { SecurityModule } from '../../security/security.module';
import { CacheInterceptor } from '../../cache/cache.interceptor';

@Module({
  imports: [
    TypeOrmModule.forFeature([Job, JobPhoto, Conversation]),
    DatabaseModule,
    EventsModule,
    SecurityModule,
  ],
  controllers: [BookingController],
  providers: [BookingService, BookingCreatedHandler, CacheInterceptor],
  exports: [BookingService],
})
export class BookingModule {}
