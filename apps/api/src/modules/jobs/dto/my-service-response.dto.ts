import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Job } from '../../../database/entities/job.entity';
import { JobStatus } from '../../../database/common/enum';
import { MyServiceStatusFilter } from './my-services-query.dto';
import { money } from '../../../interfaces/money.util';

const JOB_STATUS_TO_FILTER: Partial<Record<JobStatus, MyServiceStatusFilter>> = {
  [JobStatus.SELECTED]:    MyServiceStatusFilter.TO_DO,
  [JobStatus.IN_PROGRESS]: MyServiceStatusFilter.IN_PROGRESS,
  [JobStatus.COMPLETED]:   MyServiceStatusFilter.COMPLETED,
  [JobStatus.CANCELLED]:   MyServiceStatusFilter.CANCELLED,
};

export class MyServiceResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  title!: string;

  @ApiPropertyOptional()
  description?: string | null;

  @ApiPropertyOptional()
  locationText?: string | null;

  @ApiProperty()
  price!: number;

  @ApiProperty({
    enum: [...Object.values(MyServiceStatusFilter), 'cancellation_awaiting'],
    description: "Provider-facing status label. 'cancellation_awaiting' while a subscription " +
      'cancellation is scheduled (14-day notice) but not yet effective — the job still sits in the in_progress tab.',
  })
  status!: MyServiceStatusFilter | 'cancellation_awaiting';

  @ApiPropertyOptional()
  assignedAt?: Date | null;

  @ApiPropertyOptional({ description: 'Category assigned to the job', example: 'Plumbing', nullable: true })
  categoryName!: string | null;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty({ description: 'True while the seeker has scheduled a subscription cancellation (14-day notice) not yet effective' })
  cancellationPending!: boolean;

  @ApiPropertyOptional({ description: 'When the scheduled cancellation takes effect; null unless cancellationPending', nullable: true })
  cancellationEffectiveAt?: Date | null;

  static from(job: Job, cancellationEffectiveAt: Date | null = null): MyServiceResponseDto {
    const dto = new MyServiceResponseDto();
    dto.id = job.id;
    dto.title = job.title ?? '';
    dto.description = job.description ?? null;
    dto.locationText = job.locationText ?? null;
    dto.price = money(job.selectedBid?.price ?? 0);
    dto.status = JOB_STATUS_TO_FILTER[job.status] ?? job.status as unknown as MyServiceStatusFilter;
    dto.assignedAt = job.selectedAt ?? null;
    dto.categoryName = job.category?.name ?? null;
    dto.createdAt = job.createdAt;
    const isTerminal = job.status === JobStatus.COMPLETED || job.status === JobStatus.CANCELLED;
    const pending = cancellationEffectiveAt != null && !isTerminal;
    dto.cancellationPending = pending;
    dto.cancellationEffectiveAt = pending ? cancellationEffectiveAt : null;
    if (pending) dto.status = 'cancellation_awaiting';
    return dto;
  }
}
