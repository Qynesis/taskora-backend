import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsEnum, IsOptional, IsString, IsUrl, IsUUID, MaxLength, MinLength } from 'class-validator';
import { RefundRequestReason } from '../../../database/common/enum';

export class CreateRefundRequestDto {
  @ApiProperty({ description: 'Job id to request refund for', format: 'uuid' })
  @IsUUID('4')
  jobId!: string;

  @ApiProperty({
    enum: RefundRequestReason,
    description: 'Reason for refund request',
  })
  @IsEnum(RefundRequestReason)
  reason!: RefundRequestReason;

  @ApiPropertyOptional({
    description: 'Additional comments from seeker',
    example: 'Provider arrived late and did not complete the agreed scope of work.',
  })
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(2000)
  comments?: string;

  @ApiPropertyOptional({
    type: [String],
    description: 'Uploaded evidence file URLs from storage upload API',
  })
  @IsOptional()
  @IsArray()
  @IsUrl({}, { each: true })
  evidenceUrls?: string[];
}
