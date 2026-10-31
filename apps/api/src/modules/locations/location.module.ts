import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { State } from '../../database/entities/state.entity';
import { Suburb } from '../../database/entities/suburb.entity';
import { LocationService } from './location.service';
import { LocationController } from './location.controller';
import { SecurityModule } from '../../security/security.module';
import { CacheInterceptor } from '../../cache/cache.interceptor';

@Module({
  imports: [
    TypeOrmModule.forFeature([State, Suburb]),
    SecurityModule,
  ],
  controllers: [LocationController],
  providers: [LocationService, CacheInterceptor],
  exports: [LocationService],
})
export class LocationModule {}
