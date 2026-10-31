import { IsEnum, IsOptional, IsInt, Min, Max } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { BaseQueryDto } from '../../../interfaces/base-query.dto';

export enum TransactionTypeFilter {
  PAYMENT = 'payment',
  REFUND = 'refund',
}

export class AdminPaymentQueryDto extends BaseQueryDto {
  @ApiPropertyOptional({ enum: TransactionTypeFilter, description: 'Filter to only payments or only refunds' })
  @IsOptional()
  @IsEnum(TransactionTypeFilter)
  type?: TransactionTypeFilter;

  @ApiPropertyOptional({ description: 'Month (1–12) within the current year', example: 3, minimum: 1, maximum: 12 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  month?: number;

  @ApiPropertyOptional({ description: 'ISO week number (1–53) within the current year', example: 12, minimum: 1, maximum: 53 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(53)
  week?: number;
}
