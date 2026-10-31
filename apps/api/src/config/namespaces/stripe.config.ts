import { registerAs } from '@nestjs/config';

export interface StripeConfigType extends Record<string, unknown> {
  secretKey: string;
  apiVersion: '2026-04-22.dahlia';
  webhookSecret: string;
  webhookSecretConnect: string;
}

export const stripeConfig = registerAs(
  'stripe',
  (): StripeConfigType => ({
    secretKey: process.env['STRIPE_SEC_KEY'] || '',
    apiVersion: (process.env['STRIPE_API_VERSION'] || '2026-04-22.dahlia') as '2026-04-22.dahlia',
    webhookSecret: process.env['STRIPE_WEBHOOK_SECRET'] || '',
    webhookSecretConnect: process.env['STRIPE_WEBHOOK_SECRET_CONNECT'] || '',
  }),
);