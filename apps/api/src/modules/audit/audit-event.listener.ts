import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { AuditService } from './audit.service';
import { JobCreatedEvent } from '../jobs/events/job-created.event';
import { JobStatusChangedEvent } from '../jobs/events/job-status-changed.event';
import { BidCreatedEvent } from '../bids/events/bid-created.event';
import { BidStatusChangedEvent } from '../bids/events/bid-status-changed.event';
import { SelectionCreatedEvent } from '../selections/events/selection-created.event';
import { BookingCreatedEvent } from '../bookings/events/booking-created.event';
import { PaymentCreatedEvent } from '../payments/events/payment-created.event';
import { ReportCreatedEvent } from '../reports/events/report-created.event';
import { VerificationCreatedEvent } from '../verification/events/verification-created.event';
import { SupportTicketCreatedEvent } from '../support/events/support-ticket-created.event';
import { BidUpdatedEvent } from '../bids/events/bid-updated.event';
import { BookingStatusChangedEvent } from '../bookings/events/booking-status-changed.event';
import { JobRefundRequestedEvent } from '../jobs/events/job-refund-requested.event';
import { RefundRejectedEvent } from '../jobs/events/refund-rejected.event';
import { CardAddedEvent } from '../payments/events/card-added.event';
import { ProfileCreatedEvent } from '../profile/events/profile-created.event';
import { ReportStatusChangedEvent } from '../reports/events/report-status-changed.event';
import { ReportWarningSentEvent } from '../reports/events/report-warning-sent.event';
import { VerificationStepReviewedEvent } from '../verification/events/verification-step-reviewed.event';

@Injectable()
export class AuditEventListener {
  private readonly logger = new Logger(AuditEventListener.name);

  constructor(private readonly auditService: AuditService) {}

  @OnEvent(JobCreatedEvent.EVENT_NAME)
  async onJobCreated(event: JobCreatedEvent): Promise<void> {
    await this.safeLog({
      action: 'JOB_CREATED',
      entityType: 'job',
      entityId: event.jobId,
      metadata: { title: event.name },
    });
  }

  @OnEvent(JobStatusChangedEvent.EVENT_NAME)
  async onJobStatusChanged(event: JobStatusChangedEvent): Promise<void> {
    await this.safeLog({
      action: 'JOB_STATUS_CHANGED',
      entityType: 'job',
      entityId: event.jobId,
      actorId: event.seekerId,
      metadata: { title: event.jobTitle, newStatus: event.newStatus },
    });
  }

  @OnEvent(BidCreatedEvent.EVENT_NAME)
  async onBidCreated(event: BidCreatedEvent): Promise<void> {
    await this.safeLog({
      action: 'BID_PLACED',
      entityType: 'bid',
      entityId: event.bidId,
      actorId: event.providerId,
      metadata: { jobId: event.jobId, price: event.price, currency: event.currency },
    });
  }

  @OnEvent(BidStatusChangedEvent.EVENT_NAME)
  async onBidStatusChanged(event: BidStatusChangedEvent): Promise<void> {
    await this.safeLog({
      action: 'BID_STATUS_CHANGED',
      entityType: 'bid',
      entityId: event.bidId,
      actorId: event.actorUserId,
      metadata: {
        jobId: event.jobId,
        jobTitle: event.jobTitle,
        oldStatus: event.oldStatus,
        newStatus: event.newStatus,
      },
    });
  }

  @OnEvent(SelectionCreatedEvent.EVENT_NAME)
  async onSelectionCreated(event: SelectionCreatedEvent): Promise<void> {
    await this.safeLog({
      action: 'PROVIDER_SELECTED',
      entityType: 'selection',
      entityId: event.selectionId,
      actorId: event.actorUserId,
    });
  }

  @OnEvent(BookingCreatedEvent.EVENT_NAME)
  async onBookingCreated(event: BookingCreatedEvent): Promise<void> {
    await this.safeLog({
      action: 'BOOKING_CREATED',
      entityType: 'booking',
      entityId: event.bookingId,
      actorId: event.seekerUserId,
      metadata: {
        providerUserId: event.providerUserId,
        seekerUserId: event.seekerUserId,
      },
    });
  }

  @OnEvent(PaymentCreatedEvent.EVENT_NAME)
  async onPaymentCreated(event: PaymentCreatedEvent): Promise<void> {
    await this.safeLog({
      action: 'PAYMENT_CREATED',
      entityType: 'payment',
      entityId: event.paymentId,
      actorId: event.seekerId,
      metadata: {
        seekerId: event.seekerId,
        providerId: event.providerId,
        amount: event.amount,
        jobTitle: event.jobTitle,
      },
    });
  }

  @OnEvent(ReportCreatedEvent.EVENT_NAME)
  async onReportCreated(event: ReportCreatedEvent): Promise<void> {
    await this.safeLog({
      action: 'REPORT_SUBMITTED',
      entityType: 'report',
      entityId: event.reportId,
      actorId: event.actorUserId,
    });
  }

  @OnEvent(VerificationCreatedEvent.EVENT_NAME)
  async onVerificationCreated(event: VerificationCreatedEvent): Promise<void> {
    await this.safeLog({
      action: 'VERIFICATION_OPENED',
      entityType: 'verification',
      entityId: event.verificationId,
      actorId: event.actorUserId,
    });
  }

  @OnEvent(SupportTicketCreatedEvent.EVENT_NAME)
  async onSupportTicketCreated(event: SupportTicketCreatedEvent): Promise<void> {
    await this.safeLog({
      action: 'SUPPORT_TICKET_OPENED',
      entityType: 'support_ticket',
      entityId: event.ticketId,
      actorId: event.userId,
      metadata: { subject: event.subject },
    });
  }

  @OnEvent(BidUpdatedEvent.EVENT_NAME)
  async onBidUpdated(event: BidUpdatedEvent): Promise<void> {
    await this.safeLog({
      action: 'BID_UPDATED',
      entityType: 'bid',
      entityId: event.bidId,
      actorId: event.providerId,
      metadata: { jobId: event.jobId, price: event.price, currency: event.currency },
    });
  }

  @OnEvent(BookingStatusChangedEvent.EVENT_NAME)
  async onBookingStatusChanged(event: BookingStatusChangedEvent): Promise<void> {
    await this.safeLog({
      action: 'BOOKING_STATUS_CHANGED',
      entityType: 'booking',
      entityId: event.bookingId,
      actorId: event.actorUserId,
      metadata: { newStatus: event.newStatus },
    });
  }

  @OnEvent(JobRefundRequestedEvent.EVENT_NAME)
  async onJobRefundRequested(event: JobRefundRequestedEvent): Promise<void> {
    await this.safeLog({
      action: 'REFUND_REQUESTED',
      entityType: 'refund_request',
      entityId: event.refundRequestId,
      actorId: event.seekerId,
      metadata: { jobId: event.jobId, jobTitle: event.jobTitle, reason: event.reason },
    });
  }

  @OnEvent(RefundRejectedEvent.EVENT_NAME)
  async onRefundRejected(event: RefundRejectedEvent): Promise<void> {
    await this.safeLog({
      action: 'REFUND_REJECTED',
      entityType: 'refund_request',
      entityId: event.refundRequestId,
      actorId: event.actorUserId,
      metadata: { jobId: event.jobId, jobTitle: event.jobTitle },
    });
  }

  @OnEvent(CardAddedEvent.EVENT_NAME)
  async onCardAdded(event: CardAddedEvent): Promise<void> {
    await this.safeLog({
      action: 'CARD_ADDED',
      entityType: 'payment_method',
      entityId: event.stripePaymentMethodId,
      actorId: event.userId,
      metadata: { brand: event.brand, last4: event.last4 },
    });
  }

  @OnEvent(ProfileCreatedEvent.EVENT_NAME)
  async onProfileCreated(event: ProfileCreatedEvent): Promise<void> {
    await this.safeLog({
      action: 'PROFILE_CREATED',
      entityType: 'profile',
      entityId: event.profileId,
      actorId: event.userId,
    });
  }

  @OnEvent(ReportStatusChangedEvent.EVENT_NAME)
  async onReportStatusChanged(event: ReportStatusChangedEvent): Promise<void> {
    await this.safeLog({
      action: 'REPORT_STATUS_CHANGED',
      entityType: 'report',
      entityId: event.reportId,
      actorId: event.actorUserId,
      metadata: { newStatus: event.newStatus },
    });
  }

  @OnEvent(ReportWarningSentEvent.EVENT_NAME)
  async onReportWarningSent(event: ReportWarningSentEvent): Promise<void> {
    await this.safeLog({
      action: 'REPORT_WARNING_SENT',
      entityType: 'user_warning',
      entityId: event.warningId,
      actorId: event.actorUserId,
      metadata: { recipientUserId: event.recipientUserId, reportRef: event.reportRef },
    });
  }

  @OnEvent(VerificationStepReviewedEvent.EVENT_NAME)
  async onVerificationStepReviewed(event: VerificationStepReviewedEvent): Promise<void> {
    await this.safeLog({
      action: 'VERIFICATION_STEP_REVIEWED',
      entityType: 'verification_step',
      entityId: event.stepId,
      actorId: event.actorUserId,
      metadata: { stepType: event.stepType, status: event.status },
    });
  }

  private async safeLog(params: Parameters<AuditService['log']>[0]): Promise<void> {
    try {
      await this.auditService.log(params);
    } catch (err) {
      this.logger.error(
        `Failed to write audit log [${params.action}]: ${(err as Error).message}`,
      );
    }
  }
}
