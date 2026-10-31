import { Module, RequestMethod } from '@nestjs/common';
import { LoggerModule as PinoLoggerModule } from 'nestjs-pino';
import { ConfigService } from '@nestjs/config';
import { IncomingMessage, ServerResponse } from 'http';
import { AppConfigType } from '../config/namespaces/app.config';
import { RequestIdMiddleware } from './request-id.middleware';

@Module({
  imports: [
    PinoLoggerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const app = configService.get<AppConfigType>('app')!;
        const isDev = app.nodeEnv === 'development';
        const healthPath = `/${app.apiPrefix}/health`;
        const usePrettyLogs = isDev || app.logPretty;

        return {
          forRoutes: [{ path: '/*path', method: RequestMethod.ALL }],
          pinoHttp: {
            level: app.logLevel,
            transport: usePrettyLogs ? { target: 'pino-pretty', options: { colorize: true } } : undefined,
            serializers: {
              req: (req) => ({
                id: req.id,
                method: req.method,
                url: req.url,
              }),
              res: (res) => ({
                statusCode: res.statusCode,
              }),
            },
            customProps: (req: IncomingMessage, _res: ServerResponse) => ({
              requestId: (req as IncomingMessage & { id?: string | number }).id,
            }),
            autoLogging: {
              ignore: (req: IncomingMessage) => {
                const url = req.url || '';
                return url === healthPath || url.startsWith(`${healthPath}?`);
              },
            },
          },
        };
      },
    }),
  ],
  providers: [RequestIdMiddleware],
  exports: [PinoLoggerModule],
})
export class AppLoggerModule {}
