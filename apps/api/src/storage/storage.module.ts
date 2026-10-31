import { Global, Module } from '@nestjs/common';
import { AzureStorageService } from './storage.service';
import { StorageController } from './storage.controller';
import { SecurityModule } from '../security/security.module';

/**
 * Global infrastructure module — import once in AppModule.
 * Any feature module can inject AzureStorageService without importing StorageModule.
 */
@Global()
@Module({
  imports: [SecurityModule],
  controllers: [StorageController],
  providers: [AzureStorageService],
  exports: [AzureStorageService],
})
export class StorageModule {}
