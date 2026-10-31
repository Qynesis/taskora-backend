import { ApiProperty } from '@nestjs/swagger';

export class UploadUrlResponseDto {
  @ApiProperty({ description: 'SAS URL used for PUT upload' })
  uploadUrl!: string;

  @ApiProperty({ description: 'Clean blob URL to store in DB' })
  blobUrl!: string;

  @ApiProperty({ description: 'Blob name inside the container' })
  blobName!: string;
}
