import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { BaseQueryDto } from '../../../interfaces/base-query.dto';

export enum SeekerRequestStatusFilter {
  REQUESTED = 'requested',
  BIDDING = 'bidding',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export class SeekersJobQueryDto extends BaseQueryDto {
  @ApiPropertyOptional({ description: 'Search by job reference (e.g. JOB-123456) or job title (partial match)' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    enum: SeekerRequestStatusFilter,
    description: 'Tab status filter: requested, in_progress, completed, or cancelled. requested includes posted+bidding; aliases: posted->requested, bidding->requested, cancelled->cancelled',
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value !== 'string') return value;
    const normalized = value.toLowerCase();
    if (normalized === 'posted') return SeekerRequestStatusFilter.REQUESTED;
    return normalized === 'cancelled' ? SeekerRequestStatusFilter.CANCELLED : normalized;
  })
  @IsEnum(SeekerRequestStatusFilter)
  status?: SeekerRequestStatusFilter;

  @ApiPropertyOptional({ description: 'Filter by location (partial match)' })
  @IsOptional()
  @IsString()
  locationText?: string;

  @ApiPropertyOptional({ description: 'Filter by category ID' })
  @IsOptional()
  @IsUUID('4')
  categoryId?: string;
}
