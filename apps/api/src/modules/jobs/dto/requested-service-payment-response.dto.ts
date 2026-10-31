import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { JobStatus, PaymentStatus, ServiceDuration } from '../../../database/common/enum';
import { Job } from '../../../database/entities/job.entity';
import { money } from '../../../interfaces/money.util';

const DURATION_LABEL: Record<ServiceDuration, string> = {
  [ServiceDuration.SINGLE_TASK]: 'Single task',
  [ServiceDuration.ONE_MONTH]: '1 month',
  [ServiceDuration.THREE_MONTHS]: '3 months',
  [ServiceDuration.SIX_MONTHS]: '6 months',
};

export class RequestedServicePaymentResponseDto {
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

  @ApiPropertyOptional()
  budgetPrice?: number | null;

  @ApiPropertyOptional({ description: 'Accepted offer price from the selected bid', nullable: true })
  acceptedOfferPrice?: number | null;

  @ApiProperty({ enum: JobStatus })
  status!: JobStatus;

  @ApiPropertyOptional({ enum: [...Object.values(PaymentStatus), 'subscription_ongoing', 'cancellation_awaiting'], nullable: true })
  paymentStatus?: PaymentStatus | 'subscription_ongoing' | 'cancellation_awaiting' | null;

  @ApiPropertyOptional({
    description: 'Invoice PDF URL — present only when paymentStatus is succeeded, null otherwise',
    nullable: true,
    example: 'https://invoice.stripe.com/acct_xxx/invst_xxx/pdf',
  })
  invoiceUrl?: string | null;

  @ApiPropertyOptional()
  category?: { id: string; name: string } | null;

  @ApiPropertyOptional({
    description: 'Selected provider summary for this job',
    nullable: true,
    type: 'object',
    properties: {
      businessName: { type: 'string', nullable: true, example: 'Star Plumbing' },
      avgRating: { type: 'number', example: 4.5 },
      avatarUrl: { type: 'string', nullable: true, example: 'https://cdn.example.com/avatar.jpg' },
      categoryNames: { type: 'array', items: { type: 'string' }, example: ['Plumbing', 'Cleaning'] },
    },
  })
  selectedProviderInfo?: {
    businessName: string | null;
    avgRating: number;
    avatarUrl: string | null;
    categoryNames: string[];
  } | null;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty({ description: 'Number of bids submitted on this job' })
  bidCount!: number;

  @ApiProperty({ description: 'Human-readable service duration', example: '3 months' })
  duration!: string;

  @ApiProperty({ description: 'True for subscription-based (non-single-task) jobs' })
  isLongTerm!: boolean;

  @ApiProperty({
    description:
      'Whether a contract has been created for this job. Always false for single-task jobs; ' +
      'for long-term jobs, true when a job_contracts row exists.',
  })
  hasContract!: boolean;

  @ApiProperty({ description: 'Currency code for all monetary values', example: 'AUD' })
  currency!: string;

  @ApiProperty({ description: 'True while a seeker subscription cancellation is scheduled (14-day notice) but not yet effective' })
  cancellationPending!: boolean;

  @ApiPropertyOptional({ description: 'When the scheduled cancellation takes effect; null unless cancellationPending', nullable: true })
  cancellationEffectiveAt?: Date | null;

  static from(
    job: Job,
    bidCount: number,
    paymentStatus: PaymentStatus | null,
    isSubscription: boolean,
    hasTxn: boolean,
    invoiceUrl: string | null,
    selectedProviderInfo?: {
      businessName: string | null;
      avgRating: number;
      avatarUrl: string | null;
      categoryNames: string[];
    } | null,
    cancellationEffectiveAt: Date | null = null,
    hasContract = false,
  ): RequestedServicePaymentResponseDto {
    const dto = new RequestedServicePaymentResponseDto();
    dto.id = job.id;
    dto.jobRef = job.jobRef;
    dto.title = job.title ?? '';
    dto.description = job.description ?? null;
    dto.locationText = job.locationText ?? null;
    dto.budgetPrice = job.budgetPrice ?? null;
    dto.acceptedOfferPrice = job.selectedBid ? money(job.selectedBid.price) : null;
    dto.status = job.status;

    // Terminal payment states (refunded / cancelled) must never be shown as "ongoing" —
    // e.g. a subscription that was refunded or cancelled early still has past cycle txns.
    const isTerminal = paymentStatus === PaymentStatus.REFUNDED || paymentStatus === PaymentStatus.CANCELED;
    const cancellationPending = cancellationEffectiveAt != null && !isTerminal;

    if (isSubscription && !isTerminal && paymentStatus !== PaymentStatus.SUCCEEDED) {
      dto.paymentStatus = hasTxn ? 'subscription_ongoing' : PaymentStatus.PENDING;
    } else {
      const PENDING_STATUSES: (PaymentStatus | null)[] = [PaymentStatus.PENDING, PaymentStatus.FAILED];
      dto.paymentStatus = PENDING_STATUSES.includes(paymentStatus) ? PaymentStatus.PENDING : paymentStatus;
    }

    if (cancellationPending) {
      dto.paymentStatus = 'cancellation_awaiting';
    }

    dto.invoiceUrl = invoiceUrl;
    dto.category = job.category ? { id: job.category.id, name: job.category.name } : null;
    dto.selectedProviderInfo = selectedProviderInfo ?? null;
    dto.createdAt = job.createdAt;
    dto.bidCount = bidCount;
    dto.duration = job.serviceDuration ? (DURATION_LABEL[job.serviceDuration] ?? job.serviceDuration) : 'Single task';
    dto.isLongTerm = job.serviceDuration !== ServiceDuration.SINGLE_TASK && job.serviceDuration != null;
    // Single-task jobs never have a contract; the caller passes the long-term contract existence.
    dto.hasContract = dto.isLongTerm && hasContract;
    dto.currency = 'AUD';
    dto.cancellationPending = cancellationPending;
    dto.cancellationEffectiveAt = cancellationPending ? cancellationEffectiveAt : null;
    return dto;
  }
}
