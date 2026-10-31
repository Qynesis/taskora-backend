import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { VerificationStatus } from '../../../database/common/enum';

export class VerificationSubmissionsQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by verification case status',
    enum: VerificationStatus,
    example: VerificationStatus.SUBMITTED,
  })
  @IsOptional()
  @IsEnum(VerificationStatus)
  status?: VerificationStatus;

  @ApiPropertyOptional({
    description: 'Filter by month (1–12). Always scoped to the current year.',
    example: 6,
    minimum: 1,
    maximum: 12,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  month?: number;
}
