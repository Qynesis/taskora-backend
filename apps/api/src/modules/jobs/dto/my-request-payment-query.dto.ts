import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';
import { SeekersJobQueryDto } from './seekers-job-query.dto';

export enum SeekerPaymentStatusFilter {
  ALL = 'all',
  PAID = 'paid',
  DUE = 'due',
  REFUNDED = 'refunded',
}

export class MyRequestPaymentQueryDto extends SeekersJobQueryDto {
  @ApiPropertyOptional({
    enum: SeekerPaymentStatusFilter,
    description: 'Filter by payment state for seeker payment page',
    default: SeekerPaymentStatusFilter.ALL,
  })
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.toLowerCase() : value))
  @IsEnum(SeekerPaymentStatusFilter)
  paymentStatus?: SeekerPaymentStatusFilter;
}
