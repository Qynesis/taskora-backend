import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { AppConfigModule } from './config/config.module';
import { DatabaseModule } from './database/database.module';
import { AppLoggerModule } from './logger/logger.module';
import { SecurityModule } from './security/security.module';
import { EventsModule } from './events/events.module';
import { AppCacheModule } from './cache/cache.module';
import { QueueModule } from './modules/queue/queue.module';
import { StorageModule } from './storage/storage.module';
import { HealthModule } from './modules/health/health.module';
import { UsersModule } from './modules/users/users.module';
import { ProfileModule } from './modules/profile/profile.module';
import { AdminModule } from './modules/admin/admin.module';
import { AuditModule } from './modules/audit/audit.module';
import { BidModule } from './modules/bids/bid.module';
import { BillingModule } from './modules/billing/billing.module';
import { CategoryModule } from './modules/categories/category.module';
import { SkillModule } from './modules/skills/skill.module';
import { ConversationModule } from './modules/conversation/conversation.module';
import { JobModule } from './modules/jobs/job.module';
import { MessageModule } from './modules/messages/message.module';
import { PaymentModule } from './modules/payments/payment.module';
import { ReportModule } from './modules/reports/report.module';
import { SelectionModule } from './modules/selections/selection.module';
import { SubscriptionModule } from './modules/subscriptions/subscription.module';
import { ReviewModule } from './modules/reviews/review.module';
import { VerificationModule } from './modules/verification/verification.module';
import { BookingModule } from './modules/bookings/booking.module';
import { StripeModule } from './modules/stripe/stripe.module';
import { WarningThreadModule } from './modules/warning/warning-thread.module';
import { SupportModule } from './modules/support/support.module';
import { NotificationModule } from './modules/notification/notification.module';
import { LocationModule } from './modules/locations/location.module';
import { ContactModule } from './modules/contact/contact.module';
import { AccountModule } from './modules/account/account.module';

@Module({
  imports: [
    // Rate limiting: 100 requests per minute per IP (global)
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),

    // Infrastructure
    AppConfigModule,
    AppLoggerModule,
    DatabaseModule,
    AppCacheModule,
    SecurityModule,
    EventsModule,
    QueueModule,
    StorageModule,
    StripeModule,

    // Feature modules
    HealthModule,
    UsersModule,
    ProfileModule,
    AdminModule,
    AuditModule,
    BidModule,
    BillingModule,
    CategoryModule,
    SkillModule,
    ConversationModule,
    JobModule,
    MessageModule,
    PaymentModule,
    ReportModule,
    ReviewModule,
    SelectionModule,
    SubscriptionModule,
    VerificationModule,
    BookingModule,
    WarningThreadModule,
    SupportModule,
    NotificationModule,
    LocationModule,
    ContactModule,
    AccountModule,
  ],
  providers: [
    // Apply ThrottlerGuard globally — use @SkipThrottle() on webhook/health endpoints
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
