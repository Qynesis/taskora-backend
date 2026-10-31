import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StripeAccount } from '../../database/entities/stripe-account.entity';
import { StripeCustomer } from '../../database/entities/stripe-customer.entity';
import { BillingService } from './billing.service';
import { BillingController } from './billing.controller';
import { BillingCustomerCreatedHandler } from './events/billing-customer-created.handler';
import { DatabaseModule } from '../../database/database.module';
import { EventsModule } from '../../events/events.module';
import { SecurityModule } from '../../security/security.module';
import { CacheInterceptor } from '../../cache/cache.interceptor';
import { Profile, User } from '../../database';

@Module({
  imports: [
    TypeOrmModule.forFeature([
        StripeAccount, StripeCustomer, User, Profile
    ]),
    DatabaseModule,
    EventsModule,
    SecurityModule,
  ],
  controllers: [BillingController],
  providers: [BillingService, BillingCustomerCreatedHandler, CacheInterceptor],
  exports: [BillingService],
})
export class BillingModule {}
