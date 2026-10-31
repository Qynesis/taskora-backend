import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { JobStatus, ServiceDuration } from '../../../database/common/enum';
import { Job } from '../../../database/entities/job.entity';

const DURATION_LABEL: Record<ServiceDuration, string> = {
  [ServiceDuration.SINGLE_TASK]: 'Single task',
  [ServiceDuration.ONE_MONTH]: '1 month',
  [ServiceDuration.THREE_MONTHS]: '3 months',
  [ServiceDuration.SIX_MONTHS]: '6 months',
};

export class RequestedServiceResponseDto {
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

  @ApiPropertyOptional({ description: 'Total contract budget (rate × periods × months)' })
  totalBudget?: number | null;

  @ApiProperty({
    enum: [...Object.values(JobStatus), 'cancellation_awaiting'],
    description: "Job status. 'cancellation_awaiting' while a subscription cancellation is scheduled " +
      '(14-day notice) but not yet effective — the job is still in progress.',
  })
  status!: JobStatus | 'cancellation_awaiting';

  @ApiPropertyOptional()
  category?: { id: string; name: string } | null;

  @ApiPropertyOptional({
    description: 'Selected provider summary when available',
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
    avatarUrl: string | null;
    avgRating: number;
    categoryNames: string[];
  } | null;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty({ description: 'Number of bids submitted on this job' })
  bidCount!: number;

  @ApiPropertyOptional({ description: 'Lowest bid price submitted (most competitive)' })
  topBidPrice?: number | null;

  @ApiProperty({ description: 'Human-readable service duration', example: '3 months' })
  duration!: string;

  @ApiProperty({ description: 'True for subscription-based (non-single-task) jobs' })
  isLongTerm!: boolean;

  @ApiProperty({ description: 'Currency code for all monetary values', example: 'AUD' })
  currency!: string;

  @ApiProperty({ description: 'True if the seeker has already left a review for this job' })
  hasReviewed!: boolean;

  @ApiProperty({ description: 'True while a seeker subscription cancellation is scheduled (14-day notice) but not yet effective' })
  cancellationPending!: boolean;

  @ApiPropertyOptional({ description: 'When the scheduled cancellation takes effect; null unless cancellationPending', nullable: true })
  cancellationEffectiveAt?: Date | null;

  static from(
    job: Job,
    bidCount: number,
    topBidPrice: number | null,
    selectedProviderInfo?: {
      businessName: string | null;
      avatarUrl: string | null;
      avgRating: number;
      categoryNames: string[];
    } | null,
    cancellationEffectiveAt: Date | null = null,
    hasReviewed = false,
  ): RequestedServiceResponseDto {
    const dto = new RequestedServiceResponseDto();
    dto.id = job.id;
    dto.jobRef = job.jobRef;
    dto.title = job.title ?? '';
    dto.description = job.description ?? null;
    dto.locationText = job.locationText ?? null;
    dto.budgetPrice = job.budgetPrice ?? null;
    dto.totalBudget = job.totalBudget ?? null;
    dto.status = job.status;
    dto.category = job.category ? { id: job.category.id, name: job.category.name } : null;
    dto.selectedProviderInfo = selectedProviderInfo ?? null;
    dto.createdAt = job.createdAt;
    dto.bidCount = bidCount;
    dto.topBidPrice = topBidPrice;
    dto.duration = job.serviceDuration ? (DURATION_LABEL[job.serviceDuration] ?? job.serviceDuration) : 'Single task';
    dto.isLongTerm = job.serviceDuration !== ServiceDuration.SINGLE_TASK && job.serviceDuration != null;
    dto.currency = 'AUD';
    dto.hasReviewed = hasReviewed;
    const isTerminal = job.status === JobStatus.COMPLETED || job.status === JobStatus.CANCELLED;
    const pending = cancellationEffectiveAt != null && !isTerminal;
    dto.cancellationPending = pending;
    dto.cancellationEffectiveAt = pending ? cancellationEffectiveAt : null;
    if (pending) dto.status = 'cancellation_awaiting';
    return dto;
  }
}
