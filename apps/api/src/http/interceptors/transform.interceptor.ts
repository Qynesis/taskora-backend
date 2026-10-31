import { CallHandler, ExecutionContext, Injectable, NestInterceptor, SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, map } from 'rxjs';

import { RESPONSE_MESSAGE_KEY } from '../decorators/response-message.decorator';

const SKIP_TRANSFORM_KEY = 'skipTransform';

/**
 * Decorator to bypass the TransformInterceptor for specific routes.
 * Useful for health checks, file downloads, or any response that should
 * not be wrapped in the standard envelope.
 */
export const SkipTransform = () => SetMetadata(SKIP_TRANSFORM_KEY, true);

function extractMessage(data: unknown, decoratorMessage: string): { message: string; data: unknown } {
  if (data !== null && data !== undefined && typeof data === 'object' && '_message' in (data as object)) {
    const { _message, ...rest } = data as Record<string, unknown>;
    return { message: String(_message), data: rest };
  }
  if (data === null || data === undefined) return { message: 'No data found', data };
  if (Array.isArray(data) && data.length === 0) return { message: 'No data found', data };
  if (typeof data === 'object' && 'total' in (data as object) && (data as { total: number }).total === 0)
    return { message: 'No data found', data };
  return { message: decoratorMessage, data };
}

export interface TransformedResponse<T> {
  success: true;
  statusCode: number;
  message: string;
  data: T;
  timestamp: string;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, TransformedResponse<T> | T> {
  constructor(private readonly reflector: Reflector) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<TransformedResponse<T> | T> {
    const skip = this.reflector.getAllAndOverride<boolean>(SKIP_TRANSFORM_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (skip) {
      return next.handle();
    }

    const statusCode = context.switchToHttp().getResponse<{ statusCode: number }>().statusCode;
    const decoratorMessage = this.reflector.getAllAndOverride<string>(RESPONSE_MESSAGE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]) ?? 'Success';

    return next.handle().pipe(
      map((raw) => {
        const { message, data } = extractMessage(raw, decoratorMessage);
        return { success: true as const, statusCode, message, data: data as T, timestamp: new Date().toISOString() };
      }),
    );
  }
}
