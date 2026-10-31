import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notification } from '../../database/entities/notification.entity';
import { FcmToken } from '../../database/entities/fcm-token.entity';
import { UserNotificationSettings } from '../../database/entities/user_notification_settings.entity';
import { Job } from '../../database/entities/job.entity';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';
import { BidCreatedNotificationHandler } from './events/bid-created-notification.handler';
import { BidStatusChangedNotificationHandler } from './events/bid-status-changed-notification.handler';
import { JobStatusChangedNotificationHandler } from './events/job-status-changed-notification.handler';
import { JobRefundRequestedNotificationHandler } from './events/job-refund-requested-notification.handler';
import { DirectMessageNotificationHandler } from './events/direct-message-notification.handler';
import { ReportWarningNotificationHandler } from './events/report-warning-notification.handler';
import { SupportMessageNotificationHandler } from './events/support-message-notification.handler';
import { CardAddedNotificationHandler } from './events/card-added-notification.handler';
import { SubscriptionNotificationHandler } from './events/subscription-notification.handler';
import { BookingNotificationHandler } from './events/booking-notification.handler';
import { WarningThreadMessageNotificationHandler } from './events/warning-thread-message-notification.handler';
import { ReportResolvedNotificationHandler } from './events/report-resolved-notification.handler';
import { PaymentNotificationHandler } from './events/payment-notification.handler';
import { BookingStatusChangedNotificationHandler } from './events/booking-status-changed-notification.handler';
import { BidUpdatedNotificationHandler } from './events/bid-updated-notification.handler';
import { RefundRejectedNotificationHandler } from './events/refund-rejected-notification.handler';
import { VerificationReviewedNotificationHandler } from './events/verification-reviewed-notification.handler';
import { VerificationSubmittedNotificationHandler } from './events/verification-submitted-notification.handler';
import { CertificationSubmittedNotificationHandler } from './events/certification-submitted-notification.handler';
import { CertificationReviewedNotificationHandler } from './events/certification-reviewed-notification.handler';
import { StripeAccountStatusNotificationHandler } from './events/stripe-account-status-notification.handler';
import { User } from '../../database/entities/user.entity';
import { Bid } from '../../database/entities/bid.entity';
import { Selection } from '../../database/entities/selection.entity';
import { WarningThread } from '../../database/entities/warning-thread.entity';
import { UserReport } from '../../database/entities/user-report.entity';
import { Profile } from '../../database/entities/profile.entity';
import { DatabaseModule } from '../../database/database.module';
import { EventsModule } from '../../events/events.module';
import { SecurityModule } from '../../security/security.module';
import { CacheInterceptor } from '../../cache/cache.interceptor';
import { MessageModule } from '../messages/message.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Notification, FcmToken, UserNotificationSettings, User, Job, Bid, Selection, WarningThread, UserReport, Profile]),
    DatabaseModule,
    EventsModule,
    SecurityModule,
    MessageModule,
  ],
  controllers: [NotificationController],
  providers: [
    NotificationService,
    CacheInterceptor,
    BidCreatedNotificationHandler,
    BidStatusChangedNotificationHandler,
    JobStatusChangedNotificationHandler,
    JobRefundRequestedNotificationHandler,
    DirectMessageNotificationHandler,
    ReportWarningNotificationHandler,
    SupportMessageNotificationHandler,
    CardAddedNotificationHandler,
    SubscriptionNotificationHandler,
    BookingNotificationHandler,
    WarningThreadMessageNotificationHandler,
    ReportResolvedNotificationHandler,
    PaymentNotificationHandler,
    BookingStatusChangedNotificationHandler,
    BidUpdatedNotificationHandler,
    RefundRejectedNotificationHandler,
    VerificationReviewedNotificationHandler,
    VerificationSubmittedNotificationHandler,
    CertificationSubmittedNotificationHandler,
    CertificationReviewedNotificationHandler,
    StripeAccountStatusNotificationHandler,
  ],
  exports: [NotificationService],
})
export class NotificationModule {}
