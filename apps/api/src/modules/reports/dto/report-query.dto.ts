import { IsOptional, IsString, IsEnum, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { BaseQueryDto } from '../../../interfaces/base-query.dto';
import { UserRole } from '../../../database/common/enum';

export class ReportQueryDto extends BaseQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: ['pending', 'processed'], description: 'Filter by report status' })
  @IsOptional()
  @IsEnum(['pending', 'processed'])
  status?: 'pending' | 'processed';

  @ApiPropertyOptional({
    enum: [UserRole.SEEKER, UserRole.PROVIDER],
    description: 'Filter by the role of the reporter — seeker or provider',
  })
  @IsOptional()
  @IsEnum(UserRole)
  reporterRole?: UserRole.SEEKER | UserRole.PROVIDER;

  @ApiPropertyOptional({ description: 'Filter by month (1–12). Year defaults to current year.', minimum: 1, maximum: 12 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  month?: number;
}
