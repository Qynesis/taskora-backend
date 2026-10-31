import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

/**
 * The worker's database connection.
 *
 * Configured inline rather than by importing the API's DatabaseModule: apps/worker's tsconfig
 * scopes it to its own src plus @app/shared-types, so apps/api/src/database and its config
 * namespaces are unreachable. Reading DB_* straight from the environment is the same approach
 * the worker already takes for REDIS_HOST.
 *
 * entities is deliberately empty. DataSource.query() needs no entity metadata, and worker jobs
 * run self-contained SQL. Sharing the API's entities would mean extracting them into a package
 * both apps can import — worth doing when a job actually needs the ORM, not before.
 *
 * Consequence: with no entities there is no schema default, so statements must schema-qualify
 * ("service"."..."). The search_path the API sets is not in play here.
 */
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres' as const,
        host: configService.get<string>('DB_HOST', 'localhost'),
        port: parseInt(configService.get<string>('DB_PORT', '5432'), 10),
        username: configService.get<string>('DB_USERNAME', 'postgres'),
        password: configService.get<string>('DB_PASSWORD', ''),
        database: configService.get<string>('DB_NAME', 'app'),
        schema: 'service',
        extra: { options: '-c search_path=service,public' },
        ssl:
          configService.get<string>('DB_SSL', 'false') === 'true'
            ? { rejectUnauthorized: false }
            : false,
        entities: [],
        // The worker must never mutate schema; migrations are the API's job.
        synchronize: false,
        logging: ['error'] as const,
        // Small on purpose: the worker drains a queue, it does not serve requests.
        poolSize: 5,
      }),
    }),
  ],
})
export class WorkerDbModule {}
