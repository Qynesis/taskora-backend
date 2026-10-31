import { registerAs } from '@nestjs/config';

export interface DatabaseConfigType {
  host: string;
  port: number;
  username: string;
  password: string;
  name: string;
  synchronize: boolean;
  ssl: boolean;
}

export const databaseConfig = registerAs(
  'database',
  (): DatabaseConfigType => ({
    host: process.env['DB_HOST'] || 'localhost',
    port: parseInt(process.env['DB_PORT'] || '5432', 10),
    username: process.env['DB_USERNAME'] || 'postgres',
    password: process.env['DB_PASSWORD'] || 'postgres',
    name: process.env['DB_NAME'] || 'app',
    synchronize: process.env['DB_SYNCHRONIZE'] === 'true',
    ssl: process.env['DB_SSL'] === 'true',
  }),
);
