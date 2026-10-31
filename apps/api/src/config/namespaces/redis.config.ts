import { registerAs } from '@nestjs/config';

export interface RedisConfigType {
  host: string;
  port: number;
  password: string;
}

export const redisConfig = registerAs(
  'redis',
  (): RedisConfigType => ({
    host: process.env['REDIS_HOST'] || 'localhost',
    port: parseInt(process.env['REDIS_PORT'] || '6379', 10),
    password: process.env['REDIS_PASSWORD'] || '',
  }),
);
