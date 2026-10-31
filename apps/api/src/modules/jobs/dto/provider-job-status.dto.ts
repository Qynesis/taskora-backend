import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { JobStatus } from '../../../database/common/enum';

export enum ProviderJobStatusTransition {
  IN_PROGRESS = 'in_progress',
  COMPLETED   = 'completed',
}

export class ProviderJobStatusDto {
  @ApiProperty({
    enum: ProviderJobStatusTransition,
    description: 'Allowed transitions: in_progress (start the job) or completed (finish the job)',
    example: ProviderJobStatusTransition.IN_PROGRESS,
  })
  @IsEnum(ProviderJobStatusTransition)
  status!: ProviderJobStatusTransition;
}
