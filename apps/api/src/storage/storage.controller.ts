import { Body, Controller, ForbiddenException, Get, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiProperty, ApiResponse, ApiTags } from '@nestjs/swagger';
import { IsNotEmpty, IsUrl } from 'class-validator';
import { AuthenticatedUser } from '@app/shared-types';
import { AzureStorageService } from './storage.service';
import { BulkUploadUrlRequestDto } from './dto/bulk-upload-url-request.dto';
import { StorageFolder, validateUploadRequest } from './dto/upload-url-request.dto';
import { UploadUrlResult } from './storage.types';
import { ApiAuth } from '../security/decorators/api-auth.decorator';
import { CurrentUser } from '../security/decorators/current-user.decorator';
import { Roles } from '../security/decorators/roles.decorator';
import { Role } from '../security/rbac/roles.enum';
import { ResponseMessage } from '../http/decorators/response-message.decorator';
import { UploadUrlResponseDto } from './dto/upload-url-response.dto';

/**
 * Folders that any authenticated user may request a SAS read URL for.
 * Admins can always read any private blob regardless of this set.
 *
 * reports → omitted: sensitive moderation data, admin-only.
 */
const USER_READABLE_FOLDERS = new Set<string>([
  StorageFolder.VERIFICATION,
  StorageFolder.CONVERSATIONS,
  StorageFolder.REFUND_REQUESTS,
  StorageFolder.SUPPORT,
  StorageFolder.WARNING_THREADS,
]);

class ReadUrlQueryDto {
  @ApiProperty({ description: 'The blobUrl returned when the file was uploaded' })
  @IsUrl()
  @IsNotEmpty()
  blobUrl!: string;
}

@ApiTags('Common | Storage')
@Controller('storage')
export class StorageController {
  constructor(private readonly storageService: AzureStorageService) {}

  /**
   * Returns a short-lived SAS read URL for a private blob.
   *
   * Access rules (enforced server-side by folder prefix in the URL):
   *   - `reports`         → Admin only
   *   - `verification`    → Any authenticated user (providers re-upload and review their own docs)
  *   - `refund-requests` → Any authenticated user
   *   - `support`         → Any authenticated user
   *   - `warning-threads` → Any authenticated user
   *
   * Public folders (`profile`, `jobs`) never need this endpoint — use the
   * blobUrl directly.
   */
  @Get('read-url')
  @ApiAuth()
  @Roles(Role.SEEKER, Role.PROVIDER, Role.ADMIN)
  @ResponseMessage('Read URL generated successfully')
  @ApiOperation({
    summary: 'Get a SAS read URL for a private blob',
    description:
      'Returns a time-limited URL that grants read access to a private blob. ' +
      'Only required for private folders: `reports` (admin only), ' +
        '`verification`, `refund-requests`, `support`, `warning-threads` (any authenticated user).',
  })
  @ApiResponse({
    status: 200,
    description: 'SAS read URL',
    schema: { properties: { readUrl: { type: 'string' } } },
  })
  async getReadUrl(
    @Query() query: ReadUrlQueryDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<{ readUrl: string }> {
    const isAdmin = user.roles.includes(Role.ADMIN);
    const folder = this.storageService.folderFromBlobUrl(query.blobUrl);

    if (!isAdmin && !USER_READABLE_FOLDERS.has(folder)) {
      throw new ForbiddenException(
        `Access to '${folder}' blobs is restricted to admins.`,
      );
    }

    const readUrl = await this.storageService.getReadSasUrl(query.blobUrl);
    return { readUrl };
  }

  /**
   * Returns SAS upload URLs for one or more files.
   *
   * Client steps:
   *  1. Call this endpoint with 1–10 files to receive an array of { uploadUrl, blobUrl, blobName, isPublic }.
   *  2. PUT each file to its corresponding `uploadUrl` (Content-Type header required).
   *  3. Pass the `blobUrl` values to the relevant resource endpoint as attachments.
   *  4. For private blobs (`isPublic: false`), call GET /storage/read-url to get a viewable URL.
   */
  @Post('upload-url')
  @ApiAuth()
  @Roles(Role.SEEKER, Role.PROVIDER, Role.ADMIN)
  @ResponseMessage('Upload URLs generated successfully')
  @ApiOperation({
    summary: 'Get pre-signed SAS upload URLs (1–10 files)',
    description:
      'Returns one SAS URL per file in the same order as the request. ' +
      'For a single file, send files with one item and read index [0] from the response.',
  })
  @ApiResponse({ status: 201, description: 'SAS upload URLs generated', type: UploadUrlResponseDto, isArray: true })
  getUploadUrls(@Body() dto: BulkUploadUrlRequestDto): Promise<UploadUrlResult[]> {
    for (const file of dto.files) {
      validateUploadRequest(file.folder, file.fileName, file.contentType);
    }
    return Promise.all(
      dto.files.map((file) =>
        this.storageService.generateUploadSasUrl({
          folder: file.folder,
          fileName: file.fileName,
          contentType: file.contentType,
        }),
      ),
    );
  }
}
