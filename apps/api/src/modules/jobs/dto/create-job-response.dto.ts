import { ApiProperty } from '@nestjs/swagger';
import { ServiceDuration } from '../../../database/common/enum';

export class CreateJobResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ nullable: true })
  title?: string | null;

  @ApiProperty({ nullable: true })
  locationText?: string | null;

  @ApiProperty({ enum: ServiceDuration, nullable: true })
  serviceDuration?: ServiceDuration | null;
}
