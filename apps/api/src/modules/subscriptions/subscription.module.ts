import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Subscription } from '../../database/entities/subscription.entity';
import { SubscriptionCancellationRequest } from '../../database/entities/subscription-cancellation-request.entity';
import { SubscriptionService } from './subscription.service';
import { SubscriptionController } from './subscription.controller';
import { DatabaseModule } from '../../database/database.module';
import { EventsModule } from '../../events/events.module';
import { SecurityModule } from '../../security/security.module';
import { CacheInterceptor } from '../../cache/cache.interceptor';
import { StripeCustomer, Selection, Bid, StripeAccount, AuditLog, Job, Payment, Transaction, JobContract } from '../../database';
import { StripeModule } from '../stripe/stripe.module';
import { PlatformFeeModule } from '../platform-fee/platform-fee.module';
import { SubscriptionWebhookHandlerService } from './services/subscription-webhook-handler.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
        Subscription,
        SubscriptionCancellationRequest,
        StripeCustomer,
        Selection,
        Bid,
        StripeAccount,
        AuditLog,
        Job,
        JobContract,
        Payment,
        Transaction,
    ]),
    DatabaseModule,
    EventsModule,
    SecurityModule,
    StripeModule,
    PlatformFeeModule,
  ],
  controllers: [SubscriptionController],
  providers: [SubscriptionService, SubscriptionWebhookHandlerService, CacheInterceptor],
  exports: [SubscriptionService, SubscriptionWebhookHandlerService],
})
export class SubscriptionModule {}
