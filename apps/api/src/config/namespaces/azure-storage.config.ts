import { registerAs } from '@nestjs/config';

export interface AzureStorageConfigType {
  connectionString: string;
  publicContainerName: string;
  privateContainerName: string;
}

export const azureStorageConfig = registerAs(
  'azureStorage',
  (): AzureStorageConfigType => ({
    connectionString: process.env['AZURE_STORAGE_CONNECTION_STRING'] ?? '',
    publicContainerName: process.env['AZURE_STORAGE_PUBLIC_CONTAINER'] ?? 'uploads-public',
    privateContainerName: process.env['AZURE_STORAGE_PRIVATE_CONTAINER'] ?? 'uploads-private',
  }),
);
