import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, IsUrl } from 'class-validator';

export class SubmitPoliceCheckDto {
  @ApiPropertyOptional({ example: 'NCC-REF-2025-0001' })
  @IsOptional() @IsString() @MaxLength(64)
  policeRefNo?: string;

  @ApiProperty({ example: 'https://cdn.example.com/police-check.pdf' })
  @IsUrl({ require_protocol: true })
  fileUrl!: string;
}