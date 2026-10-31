import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { JobStatus } from '../../../database/common/enum';

export enum BookingStatusFilter {
  PENDING    = 'pending',
  PROCESSED  = 'processed',   // maps to JobStatus.SELECTED internally
  REJECTED   = 'rejected',
  CANCELLED  = 'cancelled',
  COMPLETED  = 'completed',
}

export const BOOKING_STATUS_FILTER_TO_JOB_STATUS: Record<BookingStatusFilter, JobStatus> = {
  [BookingStatusFilter.PENDING]:   JobStatus.PENDING,
  [BookingStatusFilter.PROCESSED]: JobStatus.SELECTED,
  [BookingStatusFilter.REJECTED]:  JobStatus.REJECTED,
  [BookingStatusFilter.CANCELLED]: JobStatus.CANCELLED,
  [BookingStatusFilter.COMPLETED]: JobStatus.COMPLETED,
};

export class BookingQueryDto {
  @ApiPropertyOptional({ enum: BookingStatusFilter, description: 'pending | processed | rejected | cancelled | completed' })
  @IsOptional()
  @IsEnum(BookingStatusFilter)
  status?: BookingStatusFilter;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit: number = 20;
}
