import { IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { BaseQueryDto } from '../../../interfaces/base-query.dto';

export class LocationQueryDto extends BaseQueryDto {
  @ApiPropertyOptional({ description: 'Search by name (case-insensitive)' })
  @IsOptional()
  @IsString()
  search?: string;
}

export class SuburbQueryDto extends LocationQueryDto {
  @ApiPropertyOptional({ description: 'Filter suburbs by state UUID' })
  @IsOptional()
  @IsUUID()
  stateId?: string;
}
