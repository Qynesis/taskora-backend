import { IsString, IsNotEmpty, IsUrl } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Represents a file that was already uploaded via POST /storage/upload-url.
 * The client uploads the file first, then submits the returned blobUrl here.
 */
export class AttachmentDto {
  @ApiProperty({ description: 'Blob URL returned by the storage upload-url API', example: 'https://...blob.core.windows.net/container/reports/uuid.jpg' })
  @IsString()
  @IsNotEmpty()
  url!: string;

  @ApiProperty({ description: 'Original file name', example: 'screenshot.jpg' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ description: 'MIME type of the file', example: 'image/jpeg' })
  @IsString()
  @IsNotEmpty()
  mimeType!: string;
}
