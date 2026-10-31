import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsBoolean, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { BaseQueryDto } from '../../../interfaces/base-query.dto';

export class WarningThreadQueryDto extends BaseQueryDto {
  @ApiPropertyOptional({ description: 'Filter by closed status' })
  @IsOptional()
  @Transform(({ value }: { value: string }) => value === 'true')
  @IsBoolean()
  isClosed?: boolean;

  @ApiPropertyOptional({ description: 'Search by report ref or recipient name' })
  @IsOptional()
  @IsString()
  search?: string;
}
