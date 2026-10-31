import { IsEnum, IsOptional, IsString, ValidateIf } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RejectionReason, VerificationStatus } from '../../../database/common/enum';

export class ReviewVerificationStepDto {
  @ApiProperty({
    enum: [VerificationStatus.APPROVED, VerificationStatus.REJECTED],
    description: 'New status for this verification step',
  })
  @IsEnum([VerificationStatus.APPROVED, VerificationStatus.REJECTED])
  status!: VerificationStatus.APPROVED | VerificationStatus.REJECTED;

  @ApiPropertyOptional({
    enum: RejectionReason,
    description: 'Required when status is REJECTED',
  })
  @ValidateIf((o) => o.status === VerificationStatus.REJECTED)
  @IsEnum(RejectionReason)
  rejectionReason?: RejectionReason;

  @ApiPropertyOptional({
    description: 'Free-text clarification — required when rejectionReason is OTHER',
  })
  @ValidateIf((o) => o.rejectionReason === RejectionReason.OTHER)
  @IsString()
  rejectionNote?: string;
}
