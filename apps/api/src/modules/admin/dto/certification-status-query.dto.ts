import { IsEnum, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { CertificationStatus } from '../../../database/common/enum';

export class CertificationStatusQueryDto {
  @ApiPropertyOptional({ enum: CertificationStatus, description: 'Filter by status. Omit to return all.' })
  @IsOptional()
  @IsEnum(CertificationStatus)
  status?: CertificationStatus;
}
