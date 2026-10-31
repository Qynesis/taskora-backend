import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Skill } from '../../database/entities/skill.entity';
import { SkillService } from './skill.service';
import { SkillController } from './skill.controller';
import { DatabaseModule } from '../../database/database.module';
import { SecurityModule } from '../../security/security.module';
import { CacheInterceptor } from '../../cache/cache.interceptor';

@Module({
  imports: [
    TypeOrmModule.forFeature([Skill]),
    DatabaseModule,
    SecurityModule,
  ],
  controllers: [SkillController],
  providers: [SkillService, CacheInterceptor],
  exports: [SkillService],
})
export class SkillModule {}
