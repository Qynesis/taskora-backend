import { registerAs } from '@nestjs/config';

export interface QueueConfigType {
  defaultAttempts: number;
  defaultBackoff: number;
}

export const queueConfig = registerAs(
  'queue',
  (): QueueConfigType => ({
    defaultAttempts: parseInt(process.env['QUEUE_DEFAULT_ATTEMPTS'] || '3', 10),
    defaultBackoff: parseInt(process.env['QUEUE_DEFAULT_BACKOFF'] || '5000', 10),
  }),
);
