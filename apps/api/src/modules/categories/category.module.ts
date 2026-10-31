import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Category } from '../../database/entities/category.entity';
import { CategoryAsset } from '../../database/entities/category-asset.entity';
import { CategoryService } from './category.service';
import { CategoryController } from './category.controller';
import { CategoryCreatedHandler } from './events/category-created.handler';
import { DatabaseModule } from '../../database/database.module';
import { EventsModule } from '../../events/events.module';
import { SecurityModule } from '../../security/security.module';
import { CacheInterceptor } from '../../cache/cache.interceptor';

@Module({
  imports: [
    TypeOrmModule.forFeature([Category, CategoryAsset]),
    DatabaseModule,
    EventsModule,
    SecurityModule,
  ],
  controllers: [CategoryController],
  providers: [CategoryService, CategoryCreatedHandler, CacheInterceptor],
  exports: [CategoryService],
})
export class CategoryModule {}
