import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Job } from '../../../database/entities/job.entity';
import { ServiceDuration } from '../../../database/common/enum';

export class JobFeedItemDto {
  @ApiProperty()
  id!: string;

  @ApiPropertyOptional()
  jobRef?: string;

  @ApiProperty()
  title!: string;

  @ApiPropertyOptional()
  description?: string | null;

  @ApiPropertyOptional()
  budgetPrice?: number | null;

  @ApiProperty({ example: 'AUD', description: 'ISO 4217 code the budget is denominated in' })
  currency!: string;

  @ApiPropertyOptional()
  locationText?: string | null;

  @ApiPropertyOptional()
  category?: { id: string; name: string } | null;

  @ApiPropertyOptional({ enum: ServiceDuration, description: 'single_task | 1_month | 3_months | 6_months' })
  serviceDuration?: ServiceDuration | null;

  @ApiProperty()
  createdAt!: Date;

  static from(job: Job): JobFeedItemDto {
    const dto = new JobFeedItemDto();
    dto.id = job.id;
    dto.jobRef = job.jobRef;
    dto.title = job.title ?? '';
    dto.description = job.description ?? null;
    dto.budgetPrice = job.totalBudget ?? null;
    // Column default is 'AUD' and it is NOT NULL, so the fallback only covers a Job built in
    // memory rather than loaded — it keeps the field from ever serialising as undefined.
    dto.currency = job.currency ?? 'AUD';
    dto.locationText = job.locationText ?? null;
    dto.category = job.category ? { id: job.category.id, name: job.category.name } : null;
    dto.serviceDuration = job.serviceDuration ?? null;
    dto.createdAt = job.createdAt;
    return dto;
  }
}
