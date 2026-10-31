import { registerAs } from '@nestjs/config';

export interface ResendConfigType {
  apiKey: string;
  fromAddress: string;
  contactToAddress: string;
}

export const resendConfig = registerAs(
  'resend',
  (): ResendConfigType => ({
    apiKey: process.env['RESEND_API_KEY'] ?? '',
    fromAddress: process.env['RESEND_FROM_ADDRESS'] ?? 'noreply@taskoraservices.com.au',
    contactToAddress: process.env['CONTACT_TO_EMAIL'] ?? 'contact@taskoraservices.com.au',
  }),
);
