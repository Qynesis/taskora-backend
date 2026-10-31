import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { BaseQueryDto } from '../../../interfaces/base-query.dto';
import { CertificationStatus } from '../../../database/common/enum';

export class CertificationQueryDto extends BaseQueryDto {
  @ApiPropertyOptional({ enum: CertificationStatus, description: 'Filter by latest certification status' })
  @IsOptional()
  @IsEnum(CertificationStatus)
  status?: CertificationStatus;

  @ApiPropertyOptional({ description: 'Filter by submission month (1–12). Uses current year.', minimum: 1, maximum: 12 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  month?: number;
}
