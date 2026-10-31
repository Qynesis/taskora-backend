import { IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { BaseQueryDto } from '../../../interfaces/base-query.dto';

export class ReportableUserQueryDto extends BaseQueryDto {
  @ApiPropertyOptional({
    description: 'Search by first name, last name, or email (case-insensitive partial match)',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;
}
