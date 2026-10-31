import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Selection } from '../../database/entities/selection.entity';
import { Bid } from '../../database/entities/bid.entity';
import { Job } from '../../database/entities/job.entity';
import { Payment } from '../../database/entities/payment.entity';
import { SelectionService } from './selection.service';
import { SelectionController } from './selection.controller';
import { SelectionCreatedHandler } from './events/selection-created.handler';
import { DatabaseModule } from '../../database/database.module';
import { EventsModule } from '../../events/events.module';
import { SecurityModule } from '../../security/security.module';
import { CacheInterceptor } from '../../cache/cache.interceptor';
import { PlatformFeeModule } from '../platform-fee/platform-fee.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Selection, Bid, Job, Payment]),
    DatabaseModule,
    EventsModule,
    SecurityModule,
    PlatformFeeModule,
  ],
  controllers: [SelectionController],
  providers: [SelectionService, SelectionCreatedHandler, CacheInterceptor],
  exports: [SelectionService],
})
export class SelectionModule {}
