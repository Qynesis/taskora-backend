import { IsEnum, IsInt, IsNumber, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { BaseQueryDto } from '../../../interfaces/base-query.dto';

export enum MyServiceStatusFilter {
  TO_DO       = 'to_do',
  IN_PROGRESS = 'in_progress',
  COMPLETED   = 'completed',
  CANCELLED   = 'cancelled',
}

export class MyServicesQueryDto extends BaseQueryDto {
  @ApiProperty({
    enum: MyServiceStatusFilter,
    description: 'Tab filter: to_do (SELECTED), in_progress (IN_PROGRESS), completed (COMPLETED), cancelled (CANCELLED)',
  })
  @IsEnum(MyServiceStatusFilter)
  status!: MyServiceStatusFilter;

  @ApiPropertyOptional({ description: 'Search by job reference (e.g. JOB-123456) or job title (partial match)' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by month of selection (1–12)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  month?: number;

  @ApiPropertyOptional({ description: 'Filter by year of selection (e.g. 2025)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(2000)
  year?: number;

  @ApiPropertyOptional({ description: 'Filter by category ID' })
  @IsOptional()
  @IsUUID('4')
  categoryId?: string;

  @ApiPropertyOptional({ description: 'Filter by location (partial match)' })
  @IsOptional()
  @IsString()
  locationText?: string;

  // IsNumber rather than the IsInt used for the feed's price filters: total_budget is
  // numeric(10,2), so a bound like 533.50 is legitimate and IsInt would reject it.
  @ApiPropertyOptional({ description: "Minimum total budget (inclusive). Compared against the job's totalBudget." })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  minPrice?: number;

  @ApiPropertyOptional({ description: "Maximum total budget (inclusive). Compared against the job's totalBudget." })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  maxPrice?: number;
}
