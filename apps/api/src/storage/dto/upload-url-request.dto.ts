import { IsString, IsNotEmpty, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { BadRequestException } from '@nestjs/common';
import { extname } from 'path';

export enum StorageFolder {
  JOBS = 'jobs',
  PROFILE = 'profile',
  CATEGORIES = 'categories',
  CATEGORY_ASSETS = 'category-assets',
  VERIFICATION = 'verification',
  CONVERSATIONS = 'conversations',
  REFUND_REQUESTS = 'refund-requests',
  WARNING_THREADS = 'warning-threads',
  REPORTS = 'reports',
  SUPPORT = 'support',
}

/** Allowed MIME types and the extensions that map to them. */
const ALLOWED_MIME_TYPES: Record<string, string[]> = {
  'image/jpeg':       ['.jpg', '.jpeg'],
  'image/png':        ['.png'],
  'image/heic':       ['.heic'],
  'image/heif':       ['.heif'],
  'application/pdf':  ['.pdf'],
};

/** Folders that only allow images (no PDF). */
const IMAGE_ONLY_FOLDERS = new Set<StorageFolder>([
  StorageFolder.PROFILE,
  StorageFolder.JOBS,
  StorageFolder.CATEGORIES,
  StorageFolder.CATEGORY_ASSETS,
]);

export function validateUploadRequest(folder: StorageFolder, fileName: string, contentType: string): void {
  const allowedExtensions = ALLOWED_MIME_TYPES[contentType];
  if (!allowedExtensions) {
    throw new BadRequestException(`File type '${contentType}' is not allowed.`);
  }

  const ext = extname(fileName).toLowerCase();
  if (!allowedExtensions.includes(ext)) {
    throw new BadRequestException(`File extension '${ext}' does not match content type '${contentType}'.`);
  }

  if (IMAGE_ONLY_FOLDERS.has(folder) && contentType === 'application/pdf') {
    throw new BadRequestException(`PDF uploads are not allowed in the '${folder}' folder.`);
  }
}

export class UploadUrlRequestDto {
  @ApiProperty({
    enum: StorageFolder,
    enumName: 'StorageFolder',
    description:
      'Folder prefix inside the Azure Blob container. ' +
      'Allowed values: ' +
      Object.values(StorageFolder)
        .map((v) => `\`${v}\``)
        .join(', '),
  })
  @IsEnum(StorageFolder)
  folder!: StorageFolder;

  /** Original file name — used only to preserve the file extension. */
  @ApiProperty({ example: 'photo.jpg', description: 'Original file name (extension is kept)' })
  @IsString()
  @IsNotEmpty()
  fileName!: string;

  /** MIME type of the file being uploaded. */
  @ApiProperty({ example: 'image/jpeg', description: 'MIME type of the file' })
  @IsString()
  @IsNotEmpty()
  contentType!: string;
}
