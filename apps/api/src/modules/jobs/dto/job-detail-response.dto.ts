

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BillingPeriod, JobStatus, PaymentStatus, RefundRequestReason, RefundRequestStatus, ServiceDuration, ServiceFrequency } from '../../../database/common/enum';
import { Job } from '../../../database/entities/job.entity';

// ─── Status rail ──────────────────────────────────────────────────────────────

/** Status rail for BIDDING jobs: posted → bidding → selected → in_progress → completed */
export const JOB_RAIL_STEPS: JobStatus[] = [
  JobStatus.POSTED,
  JobStatus.BIDDING,
  JobStatus.SELECTED,
  JobStatus.IN_PROGRESS,
  JobStatus.COMPLETED,
];

/** Status rail for DIRECT (booking) jobs: pending → in_progress → completed */
export const DIRECT_RAIL_STEPS: JobStatus[] = [
  JobStatus.PENDING,
  JobStatus.IN_PROGRESS,
  JobStatus.COMPLETED,
];

export class StatusRailStepDto {
  @ApiProperty({ enum: JobStatus })
  step!: JobStatus;

  @ApiProperty({ enum: ['completed', 'active', 'upcoming'] })
  state!: 'completed' | 'active' | 'upcoming';
}

// ─── Selected provider snapshot (seeker view) ─────────────────────────────────

export class SelectedProviderSummaryDto {
  @ApiPropertyOptional({ nullable: true })
  businessName!: string | null;

  @ApiPropertyOptional({ nullable: true })
  avatarUrl!: string | null;

  @ApiProperty({ description: 'Average rating (0 if no reviews)' })
  avgRating!: number;
}

// ─── Refund overlay ───────────────────────────────────────────────────────────

/**
 * Refund overlay for the job detail. Present for a party (seeker or provider) whenever a
 * refund request exists on their payment — covering every refund state (pending / approved /
 * rejected), not only a completed refund. Kept as one nested object so the refund scenario is
 * self-contained and the base `status` / `paymentStatus` fields stay untouched.
 */
export class RefundDetailDto {
  @ApiProperty({ enum: RefundRequestStatus, description: 'Refund request state: pending, approved (refunded), or rejected' })
  status!: RefundRequestStatus;

  @ApiProperty({
    description:
      'Refund reason. A RefundRequestReason for dispute refunds; for a cancellation refund it is a ' +
      'system reason such as "seeker_cancellation".',
  })
  reason!: RefundRequestReason | string;

  @ApiPropertyOptional({ nullable: true, description: 'Seeker comment on the refund request' })
  comment?: string | null;

  @ApiProperty({ description: 'Amount to be refunded (full amount charged), in AUD' })
  amount!: number;

  @ApiProperty({ type: [String], description: 'Evidence photo URLs uploaded by the seeker with the refund request' })
  attachments!: string[];
}

// ─── Context ──────────────────────────────────────────────────────────────────

export interface MyBidSummary {
  id: string;
  price: number;
  status: string;
}

export interface JobDetailContext {
  selectedBidPrice?: number | null;
  paymentStatus?: PaymentStatus | null;
  refundReason?: string | null;
  topBidPrice?: number | null;
  acceptedOfferPrice?: number | null;
  /** Populated when the viewer is the seeker */
  statusRail?: StatusRailStepDto[];
  selectedProviderInfo?: SelectedProviderSummaryDto | null;
  /** Populated when the viewer is a provider — their existing bid on this job */
  myBid?: MyBidSummary | null;
  /** true when the viewer is a provider — maps budgetPrice to totalBudget and omits totalBudget field */
  isProvider?: boolean;
  /** true while a subscription cancellation is scheduled (14-day notice) but not yet effective */
  cancellationPending?: boolean;
  /** true when a live Stripe subscription exists for this job (checkout done, not cancelled) */
  subscriptionActive?: boolean;
  /** Refund overlay for the viewer's payment — present (for seeker/provider) when a refund request exists */
  refund?: RefundDetailDto | null;
  /** Seeker view: whether this seeker has already left a review for this job (reviews are one-per-job) */
  hasReviewed?: boolean;
}

export class JobDetailResponseDto {
  @ApiProperty()
  id!: string;

  @ApiPropertyOptional()
  jobRef?: string;

  @ApiProperty()
  title!: string;

  @ApiPropertyOptional()
  description?: string | null;

  @ApiPropertyOptional()
  locationText?: string | null;

  @ApiPropertyOptional({ enum: ServiceDuration, nullable: true })
  serviceDuration?: ServiceDuration | null;

  @ApiPropertyOptional({ nullable: true })
  isFlexibleTime?: boolean | null;

  @ApiPropertyOptional()
  budgetPrice?: number | null;

  @ApiPropertyOptional({ description: 'Total contract budget (rate × periods). Use this for display.' })
  totalBudget?: number | null;

  @ApiPropertyOptional({ enum: BillingPeriod, nullable: true })
  budgetPeriod?: BillingPeriod | null;

  @ApiPropertyOptional({ nullable: true, description: 'Service start date (YYYY-MM-DD)' })
  startDate?: string | null;

  @ApiPropertyOptional({ nullable: true, description: 'Service end date (YYYY-MM-DD)' })
  endDate?: string | null;

  @ApiPropertyOptional({ nullable: true, description: 'Service window start time (HH:MM, 24h)' })
  startTime?: string | null;

  @ApiPropertyOptional({ nullable: true, description: 'Service window end time (HH:MM, 24h)' })
  endTime?: string | null;

  @ApiPropertyOptional({ enum: ServiceFrequency, nullable: true })
  frequency?: ServiceFrequency | null;

  @ApiPropertyOptional({ type: [String], nullable: true })
  scheduledDays?: string[] | null;

  @ApiPropertyOptional({ nullable: true })
  totalHours?: number | null;

  @ApiPropertyOptional({ enum: BillingPeriod, nullable: true })
  totalHoursPeriod?: BillingPeriod | null;

  @ApiProperty({
    enum: [...Object.values(JobStatus), 'cancellation_awaiting'],
    description: "Job status. 'cancellation_awaiting' while a subscription cancellation is scheduled " +
      '(14-day notice) but not yet effective — the job is still in progress.',
  })
  status!: JobStatus | 'cancellation_awaiting';

  @ApiProperty({
    description:
      'True when a live Stripe subscription exists for this long-term job (checkout completed and ' +
      'not yet cancelled), so the seeker can cancel it. False before checkout or after it has ended. ' +
      "Show a 'Cancel Subscription' action when subscriptionActive is true and status is not 'cancellation_awaiting'.",
  })
  subscriptionActive!: boolean;

  @ApiPropertyOptional()
  category?: { id: string; name: string } | null;

  @ApiProperty({ type: [Object] })
  photos!: { fileUrl: string; sortOrder: number }[];

  @ApiProperty()
  postedBy!: string;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty({ description: 'true if single_task (short-term), false for 1_month / 3_months / 6_months (long-term)' })
  shortTerm!: boolean;

  // ─── Seeker-only ──────────────────────────────────────────────────────────────

  /**
   * Ordered status progress rail for the seeker view.
   * Steps: posted → bidding → selected → in_progress → completed.
   * Absent when the viewer is the provider.
   */
  @ApiPropertyOptional({ type: [StatusRailStepDto] })
  statusRail?: StatusRailStepDto[];

  /**
   * Summary of the selected provider.
   * Present when the viewer is the seeker and the job has reached the `selected` status or beyond.
   */
  @ApiPropertyOptional({ type: SelectedProviderSummaryDto, nullable: true })
  selectedProviderInfo?: SelectedProviderSummaryDto | null;

  // ─── Provider-only ────────────────────────────────────────────────────────────

  /**
   * Agreed price from the winning bid.
   * Only present when the viewer is the selected provider for this job.
   */
  @ApiPropertyOptional()
  selectedBidPrice?: number | null;

  /**
   * Payment status for this job.
   * Only present when the viewer is the selected provider for this job.
   */
  @ApiPropertyOptional({ enum: PaymentStatus })
  paymentStatus?: PaymentStatus | null;

  /**
   * The provider's own bid on this job.
   * null = no bid yet → call POST /jobs/:id/bids
   * present → call PATCH /bids/:id to update
   */
  @ApiPropertyOptional({
    nullable: true,
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid' },
      price: { type: 'number', example: 150 },
      status: { type: 'string', example: 'submitted' },
    },
  })
  myBid?: MyBidSummary | null;

  @ApiPropertyOptional({ description: 'Refund reason when the latest payment for this job is refunded', nullable: true })
  refundReason?: string | null;

  @ApiPropertyOptional({
    type: RefundDetailDto,
    nullable: true,
    description: 'Refund overlay (status, reason, comment, amount). Present for the seeker/provider when a ' +
      'refund request exists on their payment — covers pending, approved (refunded) and rejected. Null otherwise.',
  })
  refund?: RefundDetailDto | null;

  @ApiPropertyOptional({ description: 'Lowest bid price submitted on this job', nullable: true })
  topBidPrice?: number | null;

  @ApiPropertyOptional({ description: 'Accepted offer price — present once a bid has been selected', nullable: true })
  acceptedOfferPrice?: number | null;

  @ApiProperty({ description: 'Currency code for all monetary values', example: 'AUD' })
  currency!: string;

  @ApiProperty({ description: 'Seeker view: true if this seeker has already reviewed this job (one review per job)', example: false })
  hasReviewed!: boolean;

  static from(job: Job, context: JobDetailContext = {}): JobDetailResponseDto {
    const dto = new JobDetailResponseDto();
    dto.id = job.id;
    dto.jobRef = job.jobRef;
    dto.title = job.title ?? '';
    dto.description = job.description ?? null;
    dto.locationText = job.locationText ?? null;
    dto.serviceDuration = job.serviceDuration ?? null;
    dto.isFlexibleTime = job.isFlexibleTime ?? null;
    if (context.isProvider) {
      dto.budgetPrice = job.totalBudget ?? null;
    } else {
      dto.budgetPrice = job.budgetPrice ?? null;
      dto.totalBudget = job.totalBudget ?? null;
    }
    dto.budgetPeriod = job.budgetPeriod ?? null;
    dto.startDate = job.startDate ?? null;
    dto.endDate = job.endDate ?? null;
    dto.startTime = job.startTime ?? null;
    dto.endTime = job.endTime ?? null;
    dto.frequency = job.frequency ?? null;
    dto.scheduledDays = job.scheduledDays ?? null;
    dto.totalHours = job.totalHours ?? null;
    dto.totalHoursPeriod = job.totalHoursPeriod ?? null;
    const isTerminal = job.status === JobStatus.COMPLETED || job.status === JobStatus.CANCELLED;
    dto.status = context.cancellationPending && !isTerminal ? 'cancellation_awaiting' : job.status;
    dto.subscriptionActive = context.subscriptionActive ?? false;
    dto.category = job.category ? { id: job.category.id, name: job.category.name } : null;
    dto.photos = (job.photos ?? [])
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((p) => ({ fileUrl: p.fileUrl, sortOrder: p.sortOrder }));
    const profile = job.seeker?.profile;
    dto.postedBy = [profile?.firstName, profile?.lastName].filter(Boolean).join(' ') || job.seeker?.email || '';
    dto.createdAt = job.createdAt;
    dto.shortTerm = job.serviceDuration === ServiceDuration.SINGLE_TASK;
    dto.currency = 'AUD';
    dto.hasReviewed = context.hasReviewed ?? false;

    if (context.statusRail) {
      dto.statusRail = context.statusRail;
      dto.selectedProviderInfo = context.selectedProviderInfo ?? null;
    }

    if (context.selectedBidPrice != null) {
      dto.selectedBidPrice = context.selectedBidPrice;
    }

    if (context.paymentStatus !== undefined) {
      dto.paymentStatus = context.paymentStatus ?? null;
    }

    if (context.refundReason !== undefined) {
      dto.refundReason = context.refundReason ?? null;
    }

    if (context.refund !== undefined) {
      dto.refund = context.refund ?? null;
    }

    if (context.myBid !== undefined) {
      dto.myBid = context.myBid ?? null;
    }

    if (context.topBidPrice !== undefined) {
      dto.topBidPrice = context.topBidPrice ?? null;
    }

    if (context.acceptedOfferPrice !== undefined) {
      dto.acceptedOfferPrice = context.acceptedOfferPrice ?? null;
    }

    return dto;
  }
}
