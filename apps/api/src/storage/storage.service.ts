import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { extname } from 'path';
import { randomUUID } from 'crypto';
import {
  BlobServiceClient,
  BlobSASPermissions,
  ContainerClient,
} from '@azure/storage-blob';
import { AzureStorageConfigType } from '../config/namespaces/azure-storage.config';
import { StorageFolder } from './dto/upload-url-request.dto';
import { UploadUrlResult } from './storage.types';

/** Folders whose blobs live in the public container (no auth needed to read). */
const PUBLIC_FOLDERS = new Set<string>([StorageFolder.PROFILE, StorageFolder.JOBS, StorageFolder.CATEGORIES, StorageFolder.CATEGORY_ASSETS]);

@Injectable()
export class AzureStorageService implements OnModuleInit {
  private publicContainer!: ContainerClient;
  private privateContainer!: ContainerClient;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit(): void {
    const cfg = this.configService.get<AzureStorageConfigType>('azureStorage')!;
    const blobServiceClient = BlobServiceClient.fromConnectionString(cfg.connectionString);
    this.publicContainer = blobServiceClient.getContainerClient(cfg.publicContainerName);
    this.privateContainer = blobServiceClient.getContainerClient(cfg.privateContainerName);
  }

  private containerFor(folder: string): { client: ContainerClient; isPublic: boolean } {
    const isPublic = PUBLIC_FOLDERS.has(folder);
    return { client: isPublic ? this.publicContainer : this.privateContainer, isPublic };
  }

  /** Generate a short-lived SAS URL the client PUTs a file to directly, bypassing the API server for the
   *  binary upload. Flow: POST /storage/upload-url → PUT the file to uploadUrl → pass blobUrl to a
   *  business endpoint (e.g. POST /jobs with photos[].fileUrl). */
  async generateUploadSasUrl(options: {
    folder: string;
    fileName: string;
    contentType: string;
    expiryMinutes?: number;
  }): Promise<UploadUrlResult> {
    const { folder, fileName, contentType, expiryMinutes = 15 } = options;
    const { client, isPublic } = this.containerFor(folder);

    const ext = extname(fileName) || '';
    const blobName = `${folder}/${randomUUID()}${ext}`;

    const blobClient = client.getBlockBlobClient(blobName);

    const expiresOn = new Date();
    expiresOn.setMinutes(expiresOn.getMinutes() + expiryMinutes);

    const uploadUrl = await blobClient.generateSasUrl({
      expiresOn,
      permissions: BlobSASPermissions.from({ write: true, create: true }),
      contentType,
    });

    // blobClient.url is the clean URL without SAS params — safe to store in DB.
    return { uploadUrl, blobUrl: blobClient.url, blobName, isPublic };
  }

  /**
   * Deletes a blob identified by its full URL (as stored in the database).
   * Checks both containers. Safe to call even if the blob has already been removed.
   */
  async deleteByUrl(blobUrl: string): Promise<void> {
    const blobName = this.blobNameFromUrl(blobUrl);
    // Try both containers — the URL alone doesn't reveal which container it's in.
    await Promise.all([
      this.publicContainer.getBlockBlobClient(blobName).deleteIfExists(),
      this.privateContainer.getBlockBlobClient(blobName).deleteIfExists(),
    ]);
  }

  /**
   * Returns a time-limited SAS read URL for a blob in the private container.
   * Only needed for private blobs — public blobs are readable via their blobUrl directly.
   */
  async getReadSasUrl(blobUrl: string, expiryMinutes = 60): Promise<string> {
    const blobName = this.blobNameFromUrl(blobUrl);
    const blobClient = this.privateContainer.getBlockBlobClient(blobName);

    const expiresOn = new Date();
    expiresOn.setMinutes(expiresOn.getMinutes() + expiryMinutes);

    return blobClient.generateSasUrl({
      expiresOn,
      permissions: BlobSASPermissions.from({ read: true }),
    });
  }

  /**
   * Downloads a private blob and returns its content as a Buffer.
   * Used when the file needs to be forwarded to a third-party API (e.g. Stripe).
   */
  async downloadBuffer(blobUrl: string): Promise<{ buffer: Buffer; contentType: string }> {
    const blobName = this.blobNameFromUrl(blobUrl);
    const blobClient = this.privateContainer.getBlockBlobClient(blobName);
    const response = await blobClient.download();
    const contentType = response.contentType ?? 'application/octet-stream';
    const chunks: Buffer[] = [];
    for await (const chunk of response.readableStreamBody as AsyncIterable<Buffer>) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    return { buffer: Buffer.concat(chunks), contentType };
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  /** Extract the StorageFolder prefix from a blob URL (".../verification/uuid.pdf" → "verification"). */
  folderFromBlobUrl(blobUrl: string): string {
    const blobName = this.blobNameFromUrl(blobUrl);
    return blobName.split('/')[0] ?? '';
  }

  /** Extract the blob name from a full Azure Blob URL
   *  (https://<account>.blob.core.windows.net/<container>/<blobName>). */
  private blobNameFromUrl(blobUrl: string): string {
    const url = new URL(blobUrl);
    // pathname = "/<container>/<...blobName>"
    const parts = url.pathname.split('/');
    // parts[0] = '', parts[1] = container, parts[2..] = blob name segments
    return parts.slice(2).join('/');
  }
}
