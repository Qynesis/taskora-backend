import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Profile } from '../../database/entities/profile.entity';
import { ProviderProfessionalDetails } from '../../database/entities/provider_professional_details.entity';
import { ProviderWorkInfo } from '../../database/entities/provider_work_info.entity';
import { ProviderCategory } from '../../database/entities/provider-category.entity';
import { ProviderSkill } from '../../database/entities/provider-skill.entity';
import { ProviderMedia } from '../../database/entities/provider_media.entity';
import { ProviderEmployee } from '../../database/entities/provider_employee.entity';
import { ProviderBankDetails } from '../../database/entities/provider_bank_details.entity';
import { ProviderCertification } from '../../database/entities/provider_certification.entity';
import { SeekerFavouriteProvider } from '../../database/entities/seeker_favourite_provider.entity';
import { ProviderVerificationStep } from '../../database/entities/provider_verification_steps.entity';
import { ProviderVerificationStepFile } from '../../database/entities/provider_verification_step_files.entity';
import { ProviderVerificationCase } from '../../database/entities/provider_verification_cases.entity';
import { ProviderPerformanceStats } from '../../database/entities/provider_performance_stats.entity';
import { ProfileService } from './profile.service';
import { ProfileController } from './profile.controller';
import { ProvidersController } from './providers.controller';
import { ProfileCreatedHandler } from './events/profile-created.handler';
import { ProviderStatsListener } from './provider-stats.listener';
import { DatabaseModule } from '../../database/database.module';
import { EventsModule } from '../../events/events.module';
import { SecurityModule } from '../../security/security.module';
import { QueueModule } from '../queue/queue.module';
import { CacheInterceptor } from '../../cache/cache.interceptor';
import { SmsModule } from '../sms/sms.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Profile, ProviderProfessionalDetails, ProviderWorkInfo, ProviderCategory, ProviderSkill, ProviderMedia, ProviderEmployee, ProviderBankDetails, ProviderCertification, SeekerFavouriteProvider, ProviderVerificationStep, ProviderVerificationStepFile, ProviderVerificationCase, ProviderPerformanceStats]),
    DatabaseModule,
    EventsModule,
    SecurityModule,
    // Exports BullModule so @InjectQueue(PROVIDER_STATS) resolves in the listener. The API only
    // produces these jobs — apps/worker consumes them.
    QueueModule,
    SmsModule,
    // Provides UsersService so profile creation can self-provision the user row (ensureSynced).
    UsersModule,
  ],
  controllers: [ProfileController, ProvidersController],
  providers: [ProfileService, ProfileCreatedHandler, ProviderStatsListener, CacheInterceptor],
  exports: [ProfileService],
})
export class ProfileModule {}
