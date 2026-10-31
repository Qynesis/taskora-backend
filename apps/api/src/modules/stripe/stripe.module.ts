import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StripeService } from './stripe.service';
import { StripeController } from './stripe.controller';
import { STRIPE_CLIENT } from './stripe.constant';
import { stripeConfig } from '../../config/namespaces/stripe.config';
import { ConfigType } from '@nestjs/config';
import { DatabaseModule } from '../../database/database.module';
import { StripeAccount } from '../../database/entities/stripe-account.entity';
import Stripe from 'stripe';
import { QueueModule } from '../queue/queue.module';
import { EventsModule } from '../../events/events.module';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([StripeAccount]),
    DatabaseModule,
    QueueModule,
    EventsModule,
  ],
  providers: [
    {
        provide: STRIPE_CLIENT,
        inject: [stripeConfig.KEY],
        useFactory: (config: ConfigType<typeof stripeConfig>) => {
            if (!config.secretKey) {
                throw new Error('STRIPE_SECRET_KEY is missing from environment variables');
            }
            return new Stripe(config.secretKey, {
                apiVersion: config.apiVersion,
                appInfo: {
                    name: 'Service App',
                    version: '0.0.0',
                },
            });
        }
    },
    StripeService
  ],
  exports: [StripeService],
  controllers: [StripeController]
})
export class StripeModule {}




















// import { Module, Global } from '@nestjs/common';
// import { ConfigType } from '@nestjs/config';
// import Stripe from 'stripe';
// import stripeConfig from '../../config/namespaces/stripe.config';
// import { STRIPE_CLIENT } from './stripe.constants';

// @Global() // Makes the STRIPE_CLIENT available project-wide without constantly importing StripeModule
// @Module({
//   providers: [
//     {
//       provide: STRIPE_CLIENT,
//       inject: [stripeConfig.KEY], // Inject the strictly typed config we created in Step 1
//       useFactory: (config: ConfigType<typeof stripeConfig>) => {
//         if (!config.secretKey) {
//           throw new Error('STRIPE_SECRET_KEY is missing from environment variables');
//         }
        
//         // Initialize the heavy SDK exactly once
//         return new Stripe(config.secretKey, {
//           apiVersion: config.apiVersion,
//           appInfo: {
//             name: 'YourAppName', // Helpful for Stripe dashboard telemetry
//             version: '1.0.0',
//           },
//         });
//       },
//     },
//   ],
//   exports: [STRIPE_CLIENT], // Crucial: Export the token so other services can use it!
// })
// export class StripeModule {}
