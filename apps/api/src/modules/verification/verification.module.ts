import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Profile } from '../../database/entities/profile.entity';
import { ProviderVerificationCase } from '../../database/entities/provider_verification_cases.entity';
import { ProviderVerificationStep } from '../../database/entities/provider_verification_steps.entity';
import { ProviderVerificationStepFile } from '../../database/entities/provider_verification_step_files.entity';
import { VerificationService } from './verification.service';
import { VerificationController } from './verification.controller';
import { VerificationCreatedHandler } from './events/verification-created.handler';
import { DatabaseModule } from '../../database/database.module';
import { EventsModule } from '../../events/events.module';
import { SecurityModule } from '../../security/security.module';
import { CacheInterceptor } from '../../cache/cache.interceptor';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Profile,
      ProviderVerificationCase,
      ProviderVerificationStep,
      ProviderVerificationStepFile,
    ]),
    DatabaseModule,
    EventsModule,
    SecurityModule,
    ConfigModule,
  ],
  controllers: [VerificationController],
  providers: [VerificationService, VerificationCreatedHandler, CacheInterceptor],
  exports: [VerificationService],
})
export class VerificationModule {}
