import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { JobStatus } from '../../../database/common/enum';

const PROVIDER_ALLOWED = [JobStatus.SELECTED, JobStatus.REJECTED] as const;

export class UpdateBookingStatusDto {
  @ApiProperty({ enum: PROVIDER_ALLOWED, description: 'selected (approve booking) | rejected (decline booking)' })
  @IsEnum(PROVIDER_ALLOWED)
  status!: (typeof PROVIDER_ALLOWED)[number];
}
