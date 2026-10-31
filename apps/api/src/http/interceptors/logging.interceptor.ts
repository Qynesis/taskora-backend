import { CallHandler, ExecutionContext, Injectable, NestInterceptor, Logger } from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { Request, Response } from 'express';

/**
 * Logs NestJS handler-level request details: method, path, statusCode, duration.
 *
 * This works alongside pino-http which logs at the raw HTTP layer.
 * pino-http captures the full request lifecycle; this interceptor captures
 * timing specifically within the NestJS handler pipeline.
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();
    const { method, url } = request;
    const now = Date.now();

    return next.handle().pipe(
      tap(() => {
        const response = context.switchToHttp().getResponse<Response>();
        const duration = Date.now() - now;
        this.logger.log(`${method} ${url} ${response.statusCode} ${duration}ms`);
      }),
    );
  }
}
