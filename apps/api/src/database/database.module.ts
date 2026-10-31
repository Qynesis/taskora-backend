import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { DatabaseConfigType } from '../config/namespaces/database.config';
import { AppConfigType } from '../config/namespaces/app.config';
import { TransactionHelper } from './transaction.helper';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const db = configService.get<DatabaseConfigType>('database')!;
        const app = configService.get<AppConfigType>('app')!;
        const logQueries =
          app.nodeEnv === 'development' || (process.env['DB_LOG_QUERIES'] || 'false').toLowerCase() === 'true';

        return {
          type: 'postgres',
          host: db.host,
          port: db.port,
          username: db.username,
          password: db.password,
          database: db.name,
          schema: 'service',
          extra: { options: '-c search_path=service,public' },
          synchronize: db.synchronize,
          ssl: db.ssl ? { rejectUnauthorized: false } : false,
          autoLoadEntities: true,
          logging: logQueries ? ['query', 'error'] : ['error'],
        };
      },
    }),
  ],
  providers: [TransactionHelper],
  exports: [TransactionHelper],
})
export class DatabaseModule {}
