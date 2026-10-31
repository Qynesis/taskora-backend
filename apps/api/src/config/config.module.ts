import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { appConfig } from './namespaces/app.config';
import { databaseConfig } from './namespaces/database.config';
import { redisConfig } from './namespaces/redis.config';
import { queueConfig } from './namespaces/queue.config';
import { authConfig } from './namespaces/auth.config';
import { cacheConfig } from './namespaces/cache.config';
import { supabaseConfig } from './namespaces/supabase.config';
import { azureStorageConfig } from './namespaces/azure-storage.config';
import { envValidationSchema } from './env.validation';
import { stripeConfig } from './namespaces/stripe.config';
import { fcmConfig } from './namespaces/fcm.config';
import { esendexConfig } from './namespaces/esendex.config';
import { resendConfig } from './namespaces/resend.config';

@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, redisConfig, queueConfig, authConfig, cacheConfig, supabaseConfig, azureStorageConfig, stripeConfig, fcmConfig, esendexConfig, resendConfig],
      validationSchema: envValidationSchema,
      validationOptions: {
        abortEarly: true,
      },
    }),
  ],
})
export class AppConfigModule {}
