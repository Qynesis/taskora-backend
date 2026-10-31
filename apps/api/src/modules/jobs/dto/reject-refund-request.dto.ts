import { IsString, IsNotEmpty, IsOptional, IsArray, IsUrl, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RejectRefundRequestDto {
  @ApiProperty({ description: 'Reason for rejecting the refund request' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  rejectionReason!: string;

  @ApiPropertyOptional({ description: 'URLs of counter-evidence attachments (already uploaded to storage)', type: [String] })
  @IsOptional()
  @IsArray()
  @IsUrl({}, { each: true })
  attachmentUrls?: string[];
}
