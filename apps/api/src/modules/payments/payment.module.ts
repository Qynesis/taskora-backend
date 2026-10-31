import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Payment } from '../../database/entities/payment.entity';
import { Refund } from '../../database/entities/refund.entity';
import { PlatformFeeConfig } from '../../database/entities/platform-fee-config.entity';
import { SavedPaymentMethod } from '../../database/entities/saved-payment-method.entity';
import { RefundRequest } from '../../database/entities/refund-request.entity';
import { RefundEvidencePhoto } from '../../database/entities/refund-evidence-photo.entity';
import { Transaction } from '../../database/entities/transaction.entity';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { WebhookController } from './webhook.controller';
import { PaymentCreatedHandler } from './events/payment-created.handler';
import { CardAddedHandler } from './events/card-added.handler';
import { DatabaseModule } from '../../database/database.module';
import { EventsModule } from '../../events/events.module';
import { SecurityModule } from '../../security/security.module';
import { CacheInterceptor } from '../../cache/cache.interceptor';
import { QueueModule } from '../queue/queue.module';
import { SubscriptionModule } from '../subscriptions/subscription.module';
import { PlatformFeeModule } from '../platform-fee/platform-fee.module';
import { VerificationModule } from '../verification/verification.module';
import { AuditLog, Job, JobContract, Selection, StripeAccount, StripeCustomer, User } from '../../database';
import { Subscription } from '../../database/entities/subscription.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Payment, Refund,
      PlatformFeeConfig, SavedPaymentMethod,
      RefundRequest, RefundEvidencePhoto,
      Transaction,
      StripeAccount, User,
      StripeCustomer,
      Job, PlatformFeeConfig,
      Selection, AuditLog, JobContract,
      Subscription,
    ]),
    DatabaseModule,
    EventsModule,
    SecurityModule,
    QueueModule,
    SubscriptionModule,
    PlatformFeeModule,
    VerificationModule,
  ],
  controllers: [PaymentController, WebhookController],
  providers: [PaymentService, PaymentCreatedHandler, CardAddedHandler, CacheInterceptor],
  exports: [PaymentService],
})
export class PaymentModule {}
