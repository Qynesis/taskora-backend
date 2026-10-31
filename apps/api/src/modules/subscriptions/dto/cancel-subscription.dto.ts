import { IsEnum, IsOptional, IsString, ValidateIf } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SubscriptionCancellationReason } from '../../../database/common/enum';

export class CancelSubscriptionDto {
  @ApiProperty({
    enum: SubscriptionCancellationReason,
    description: 'Reason for cancelling the subscription',
    example: SubscriptionCancellationReason.SERVICE_QUALITY_NOT_MET,
  })
  @IsEnum(SubscriptionCancellationReason)
  reason!: SubscriptionCancellationReason;

  @ApiPropertyOptional({
    description: 'Custom reason text — required when reason is OTHER',
    example: 'Provider was unavailable for multiple sessions',
  })
  @IsOptional()
  @ValidateIf((o) => o.reason === SubscriptionCancellationReason.OTHER)
  @IsString()
  customReason?: string;
}
