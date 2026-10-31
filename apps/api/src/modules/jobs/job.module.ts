import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Job } from '../../database/entities/job.entity';
import { JobPhoto } from '../../database/entities/job-photo.entity';
import { JobContract } from '../../database/entities/job-contract.entity';
import { Payment } from '../../database/entities/payment.entity';
import { Refund } from '../../database/entities/refund.entity';
import { RefundRequest } from '../../database/entities/refund-request.entity';
import { RefundEvidencePhoto } from '../../database/entities/refund-evidence-photo.entity';
import { Subscription } from '../../database/entities/subscription.entity';
import { Transaction } from '../../database/entities/transaction.entity';
import { Profile } from '../../database/entities/profile.entity';
import { SavedPaymentMethod } from '../../database/entities/saved-payment-method.entity';
import { Category } from '../../database/entities/category.entity';
import { PlatformFeeConfig } from '../../database/entities/platform-fee-config.entity';
import { AuditLog } from '../../database/entities/audit-log.entity';
import { JobService } from './job.service';
import { JobController } from './job.controller';
import { JobCreatedHandler } from './events/job-created.handler';
import { ContractPdfService } from './contract-pdf.service';
import { DatabaseModule } from '../../database/database.module';
import { EventsModule } from '../../events/events.module';
import { SecurityModule } from '../../security/security.module';
import { CacheInterceptor } from '../../cache/cache.interceptor';
import { BidModule } from '../bids/bid.module';
import { PlatformFeeModule } from '../platform-fee/platform-fee.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Job, JobPhoto, Payment, JobContract, Subscription, Profile, SavedPaymentMethod, Category, PlatformFeeConfig, Transaction, AuditLog]),
    TypeOrmModule.forFeature([Refund, RefundRequest, RefundEvidencePhoto]),
    DatabaseModule,
    EventsModule,
    SecurityModule,
    BidModule,
    PlatformFeeModule,
  ],
  controllers: [JobController],
  providers: [JobService, JobCreatedHandler, CacheInterceptor, ContractPdfService],
  exports: [JobService],
})
export class JobModule {}
