import { IsArray, ValidateNested, ArrayMinSize, ArrayMaxSize } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { UploadUrlRequestDto } from './upload-url-request.dto';

export class BulkUploadUrlRequestDto {
  @ApiProperty({
    type: [UploadUrlRequestDto],
    description: 'List of files to generate upload URLs for (max 10)',
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(10)
  @ValidateNested({ each: true })
  @Type(() => UploadUrlRequestDto)
  files!: UploadUrlRequestDto[];
}
