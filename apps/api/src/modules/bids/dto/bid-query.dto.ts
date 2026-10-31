import { IsEnum, IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { BaseQueryDto } from '../../../interfaces/base-query.dto';
import { BidStatus } from '../../../database/common/enum';

export class BidQueryDto extends BaseQueryDto {
  @ApiPropertyOptional({ description: 'Search by job reference (e.g. JOB-123456) or job title (partial match)' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: ['bidding', ...Object.values(BidStatus)], description: 'Filter by bid status. "bidding" is an alias for "submitted"' })
  @IsOptional()
  @Transform(({ value }) => (value === 'bidding' ? BidStatus.SUBMITTED : value))
  @IsEnum(BidStatus)
  bidStatus?: BidStatus;

  @ApiPropertyOptional({ description: 'Filter by job location (partial match)' })
  @IsOptional()
  @IsString()
  locationText?: string;

  @ApiPropertyOptional({ description: 'Filter by job category ID' })
  @IsOptional()
  @IsUUID('4')
  categoryId?: string;

  @ApiPropertyOptional({ description: 'Minimum job budget price' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  minPrice?: number;

  @ApiPropertyOptional({ description: 'Maximum job budget price' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  maxPrice?: number;

  @ApiPropertyOptional({ description: 'Filter by month bid was submitted (1–12)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  month?: number;

  @ApiPropertyOptional({ description: 'Filter by year bid was submitted (e.g. 2024)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(2000)
  @Max(2100)
  year?: number;
}
