import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CompletenessFieldDto {
  @ApiProperty()
  key!: string;

  @ApiProperty()
  label!: string;

  @ApiProperty()
  complete!: boolean;
}

export class CompletenessSectionDto {
  @ApiProperty()
  key!: string;

  @ApiProperty()
  label!: string;

  @ApiProperty()
  complete!: boolean;

  @ApiProperty()
  filledCount!: number;

  @ApiProperty()
  totalCount!: number;

  @ApiProperty({ type: [CompletenessFieldDto] })
  fields!: CompletenessFieldDto[];
}

export class ProfileCompletenessDto {
  @ApiProperty({ minimum: 0, maximum: 100, description: 'Completion percentage (0–100)' })
  percentage!: number;

  @ApiProperty()
  isComplete!: boolean;

  @ApiProperty()
  filledCount!: number;

  @ApiProperty()
  totalCount!: number;

  @ApiProperty({ type: [CompletenessSectionDto] })
  sections!: CompletenessSectionDto[];
}

type Status = 'completed' | 'incomplete';

export class ProfileStatusDto {
  @ApiProperty()
  completed!: boolean;

  @ApiProperty({ description: 'Whether the phone number has been verified via OTP' })
  phoneVerified!: boolean;

  @ApiProperty({ enum: ['completed', 'incomplete'] })
  profile!: Status;

  @ApiPropertyOptional({ enum: ['completed', 'incomplete'] })
  workInfo?: Status;

  @ApiPropertyOptional({ enum: ['completed', 'incomplete'] })
  professionalDetails?: Status;

  @ApiPropertyOptional({ enum: ['completed', 'incomplete'] })
  employees?: Status;

  @ApiPropertyOptional({ enum: ['completed', 'incomplete'] })
  verification?: Status;

  @ApiPropertyOptional({ enum: ['completed', 'incomplete'] })
  certification?: Status;

  @ApiPropertyOptional({ enum: ['completed', 'incomplete'] })
  stripeAccount?: Status;

  @ApiPropertyOptional({ enum: ['completed', 'incomplete'] })
  bankDetail?: Status;
}
