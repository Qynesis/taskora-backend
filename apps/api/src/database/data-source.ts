import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

dotenv.config();

/**
 * Standalone DataSource for TypeORM CLI commands (migrations, seeding).
 * This is NOT used at runtime — NestJS creates its own DataSource via TypeOrmModule.
 */
export default new DataSource({
  type: 'postgres',
  host: process.env['DB_HOST'] || 'localhost',
  port: parseInt(process.env['DB_PORT'] || '5432', 10),
  username: process.env['DB_USERNAME'] || 'postgres',
  password: process.env['DB_PASSWORD'] || 'postgres',
  database: process.env['DB_NAME'] || 'app',
  schema: 'service',
  extra: { options: '-c search_path=service,public' },
  ssl: process.env['DB_SSL'] === 'true' ? { rejectUnauthorized: false } : false,
  entities: [
    __dirname + '/../modules/**/*.entity{.ts,.js}',
    __dirname + '/entities/*.entity{.ts,.js}',
  ],
  migrations: [__dirname + '/migrations/*{.ts,.js}'],
  migrationsTransactionMode: 'each', // allows individual migrations to set transaction=false (needed for CONCURRENTLY indexes)
  synchronize: false,
});
