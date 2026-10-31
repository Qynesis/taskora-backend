import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { PdfExportService } from './pdf-export.service';
import { DatabaseModule } from '../../database/database.module';
import { EventsModule } from '../../events/events.module';
import { SecurityModule } from '../../security/security.module';
import { CacheInterceptor } from '../../cache/cache.interceptor';
import { ReportModule } from '../reports/report.module';
import { VerificationModule } from '../verification/verification.module';
import { UsersModule } from '../users/users.module';
import { WarningThreadModule } from '../warning/warning-thread.module';
import { SupportModule } from '../support/support.module';
import { NotificationModule } from '../notification/notification.module';
import { AuditModule } from '../audit/audit.module';
import { User } from '../../database/entities/user.entity';
import { Job } from '../../database/entities/job.entity';
import { Payment } from '../../database/entities/payment.entity';
import { Refund } from '../../database/entities/refund.entity';
import { ProviderCertification } from '../../database/entities/provider_certification.entity';
import { ProviderVerificationCase, ProviderVerificationStep } from '../../database';
import { Transaction } from '../../database/entities/transaction.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Job,
      Payment,
      Refund,
      ProviderCertification,
      ProviderVerificationCase,
      ProviderVerificationStep,
      Transaction,
    ]),
    DatabaseModule,
    EventsModule,
    SecurityModule,
    ReportModule,
    VerificationModule,
    UsersModule,
    WarningThreadModule,
    SupportModule,
    NotificationModule,
    AuditModule,
  ],
  controllers: [AdminController],
  providers: [AdminService, CacheInterceptor, PdfExportService],
  exports: [AdminService],
})
export class AdminModule {}
