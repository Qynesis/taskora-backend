import { ExecutionContext, CallHandler } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { of, lastValueFrom } from 'rxjs';
import { TransformInterceptor, TransformedResponse } from './transform.interceptor';

describe('TransformInterceptor', () => {
  let interceptor: TransformInterceptor<unknown>;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    interceptor = new TransformInterceptor(reflector);
  });

  function createMockContext(skipValue = false, decoratorMessage = 'Success', statusCode = 200): ExecutionContext {
    jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((metadataKey: unknown, _targets: Array<Function>) => {
      if (metadataKey === 'skipTransform') return skipValue as never;
      if (metadataKey === 'responseMessage') return decoratorMessage as never;
      return undefined;
    });

    return {
      getHandler: () => jest.fn(),
      getClass: () => jest.fn(),
      switchToHttp: () => ({
        getResponse: () => ({ statusCode }),
      }),
    } as unknown as ExecutionContext;
  }

  it('should wrap response data in standard envelope', async () => {
    const context = createMockContext(false);
    const next: CallHandler = { handle: () => of({ id: 1 }) };

    const result$ = interceptor.intercept(context, next);
    const result = (await lastValueFrom(result$)) as TransformedResponse<unknown>;

    expect(result.success).toBe(true);
    expect(result.statusCode).toBe(200);
    expect(result.message).toBe('Success');
    expect(result.data).toEqual({ id: 1 });
    expect(result.timestamp).toBeDefined();
  });

  it('should skip transform when @SkipTransform() is applied', async () => {
    const context = createMockContext(true);
    const rawData = { id: 1 };
    const next: CallHandler = { handle: () => of(rawData) };

    const result$ = interceptor.intercept(context, next);
    const result = await lastValueFrom(result$);

    expect(result).toEqual(rawData);
  });
});
