import {
  IsString,
  IsNotEmpty,
  IsOptional,
  MaxLength,
  IsUUID,
  IsEnum,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ReportType } from '../../../database/common/enum';
import { AttachmentDto } from '../../../interfaces/attachment.dto';

export class CreateReportDto {
  @ApiProperty({ description: 'UUID of the user being reported', format: 'uuid' })
  @IsUUID()
  subjectUserId!: string;

  @ApiProperty({ enum: ReportType, description: 'Reason category for the report' })
  @IsEnum(ReportType)
  reportKind!: ReportType;

  @ApiProperty({ description: 'Detailed description of the issue' })
  @IsString()
  @IsNotEmpty()
  description!: string;

  @ApiPropertyOptional({
    type: [AttachmentDto],
    description: 'Media files already uploaded via POST /storage/upload-url. Pass the returned blobUrl for each file.',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AttachmentDto)
  attachments?: AttachmentDto[];
}
