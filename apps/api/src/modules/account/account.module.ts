import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccountController } from './account.controller';
import { AccountDeletionService } from './account-deletion.service';
import { SupabaseAdminService } from './supabase-admin.service';
import { DatabaseModule } from '../../database/database.module';
import { AuditModule } from '../audit/audit.module';
import { SecurityModule } from '../../security/security.module';
import { User } from '../../database/entities/user.entity';
import { Profile } from '../../database/entities/profile.entity';
import { Job } from '../../database/entities/job.entity';
import { Payment } from '../../database/entities/payment.entity';
import { RefundRequest } from '../../database/entities/refund-request.entity';
import { Subscription } from '../../database/entities/subscription.entity';
import { StripeAccount } from '../../database/entities/stripe-account.entity';
import { StripeCustomer } from '../../database/entities/stripe-customer.entity';
import { ProviderMedia } from '../../database/entities/provider_media.entity';
import { ProviderVerificationStepFile } from '../../database/entities/provider_verification_step_files.entity';

// StripeService (StripeModule) and AzureStorageService (StorageModule) are @Global, so they are
// available for injection without being imported here.
@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Profile,
      Job,
      Payment,
      RefundRequest,
      Subscription,
      StripeAccount,
      StripeCustomer,
      ProviderMedia,
      ProviderVerificationStepFile,
    ]),
    DatabaseModule,
    AuditModule,
    SecurityModule,
  ],
  controllers: [AccountController],
  providers: [AccountDeletionService, SupabaseAdminService],
})
export class AccountModule {}
