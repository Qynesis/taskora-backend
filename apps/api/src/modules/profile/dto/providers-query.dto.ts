import { IsEnum, IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { BaseQueryDto } from '../../../interfaces/base-query.dto';

export enum ProviderSortBy {
  RATING = 'rating',
  REVIEW_COUNT = 'review_count',
  PRICE_ASC = 'price_asc',
  PRICE_DESC = 'price_desc',
  NEWEST = 'newest',
}

export class ProvidersQueryDto extends BaseQueryDto {
  @ApiPropertyOptional({ description: 'Search by business name (partial match)' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by service category ID' })
  @IsOptional()
  @IsUUID('4')
  categoryId?: string;

  @ApiPropertyOptional({ description: 'Filter by suburb' })
  @IsOptional()
  @IsString()
  suburb?: string;

  @ApiPropertyOptional({ description: 'Filter by state' })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional({ description: 'Minimum hourly weekday rate' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  minRate?: number;

  @ApiPropertyOptional({ description: 'Maximum hourly weekday rate' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  maxRate?: number;

  @ApiPropertyOptional({ enum: ProviderSortBy, default: ProviderSortBy.NEWEST })
  @IsOptional()
  @IsEnum(ProviderSortBy)
  override sortBy: ProviderSortBy = ProviderSortBy.NEWEST;
}
