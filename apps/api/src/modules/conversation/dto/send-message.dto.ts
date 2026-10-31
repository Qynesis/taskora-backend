import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, MaxLength, MinLength, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { AttachmentDto } from '../../../interfaces/attachment.dto';

export class SendMessageDto {
  @ApiProperty({ maxLength: 2000 })
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  body!: string;

  @ApiPropertyOptional({ description: 'Optional job reference — renders as a preview card in the thread' })
  @IsOptional()
  @IsUUID()
  jobId?: string;

  @ApiPropertyOptional({
    type: [AttachmentDto],
    description: 'Files already uploaded via POST /storage/upload-url using folder "conversations". Pass the returned blobUrl for each file.',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AttachmentDto)
  attachments?: AttachmentDto[];
}
