import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { QueryFailedError, EntityNotFoundError } from 'typeorm';
import Stripe from 'stripe';

interface ErrorResponse {
  statusCode: number;
  error: string;
  message: string;
  errors: string[];
  errorCode: string;
  timestamp: string;
  path: string;
  requestId: string;
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();
    const requestId = (request.headers['x-request-id'] as string) || '';

    const errorResponse = this.buildResponse(exception, request.url, requestId);

    if (errorResponse.statusCode >= 500) {
      this.logger.error(
        `[${requestId}] ${errorResponse.error}: ${JSON.stringify(errorResponse.message)}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    } else {
      this.logger.warn(
        `[${requestId}] ${errorResponse.error}: ${JSON.stringify(errorResponse.message)}`,
      );
    }

    response.status(errorResponse.statusCode).json(errorResponse);
  }

  private buildResponse(exception: unknown, path: string, requestId: string): ErrorResponse {
    const timestamp = new Date().toISOString();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      const body =
        typeof exceptionResponse === 'object' && exceptionResponse !== null
          ? (exceptionResponse as Record<string, unknown>)
          : null;
      const rawMessage = body?.['message'] ?? exception.message;
      // ValidationPipe (class-validator) sets `message` to a string[] — one entry per failed
      // constraint. Split that into a joined human-readable `message` plus the raw `errors` list.
      // Any other HttpException has a single-string message and no field errors.
      const errors: string[] = Array.isArray(rawMessage) ? (rawMessage as string[]) : [];
      const message = errors.length > 0 ? errors.join('; ') : (rawMessage as string);
      // Throwers may pass { message, errorCode } to give the client something stable to branch on.
      // An array message means it came from validation → VALIDATION_ERROR; plain-string throws
      // keep the generic code so every existing call site is unaffected.
      const explicitCode = typeof body?.['errorCode'] === 'string' ? (body['errorCode'] as string) : null;
      const errorCode = explicitCode ?? (errors.length > 0 ? 'VALIDATION_ERROR' : 'HTTP_EXCEPTION');

      return {
        statusCode: status,
        error: HttpStatus[status] || 'Error',
        message,
        errors,
        errorCode,
        timestamp,
        path,
        requestId,
      };
    }

    if (exception instanceof QueryFailedError) {
      const pgError = exception.driverError as {
        code?: string;
        constraint?: string;
        detail?: string;
      };

      // Unique constraint violation
      if (pgError?.code === '23505') {
        return {
          statusCode: HttpStatus.CONFLICT,
          error: 'Conflict',
          message: 'A record with this value already exists',
          errors: [],
          errorCode: 'DB_UNIQUE_VIOLATION',
          timestamp,
          path,
          requestId,
        };
      }

      // Foreign key violation
      if (pgError?.code === '23503') {
        const constraint = pgError.constraint || '';

        let message = 'Referenced resource was not found';
        if (constraint.includes('seeker_user_id')) {
          message = 'Seeker user not found. Sync the user before creating a job';
        } else if (constraint.includes('category_id')) {
          message = 'Invalid categoryId';
        } else if (constraint.includes('provider_user_id')) {
          message = 'Provider user not found';
        } else if (constraint.includes('profiles_user_id')) {
          message = 'User account not found. Please sign out and sign in again to sync your account';
        }

        return {
          statusCode: HttpStatus.BAD_REQUEST,
          error: 'Bad Request',
          message,
          errors: [],
          errorCode: 'DB_FOREIGN_KEY_VIOLATION',
          timestamp,
          path,
          requestId,
        };
      }

      // Invalid text representation (e.g. malformed UUID passed to DB)
      if (pgError?.code === '22P02') {
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          error: 'Bad Request',
          message: 'Invalid value format for one or more fields',
          errors: [],
          errorCode: 'DB_INVALID_TEXT_REPRESENTATION',
          timestamp,
          path,
          requestId,
        };
      }

      // Check constraint violation
      if (pgError?.code === '23514') {
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          error: 'Bad Request',
          message: 'Request violates database constraints',
          errors: [],
          errorCode: 'DB_CHECK_VIOLATION',
          timestamp,
          path,
          requestId,
        };
      }

      return {
        statusCode: HttpStatus.BAD_REQUEST,
        error: 'Bad Request',
        message: 'Invalid database operation',
        errors: [],
        errorCode: 'DB_QUERY_FAILED',
        timestamp,
        path,
        requestId,
      };
    }

    if (exception instanceof EntityNotFoundError) {
      return {
        statusCode: HttpStatus.NOT_FOUND,
        error: 'Not Found',
        message: 'The requested resource was not found',
        errors: [],
        errorCode: 'ENTITY_NOT_FOUND',
        timestamp,
        path,
        requestId,
      };
    }

    // class-validator ValidationError array (thrown by ValidationPipe)
    if (Array.isArray(exception) && exception.length > 0 && 'constraints' in exception[0]) {
      const messages = exception.flatMap((err) =>
        Object.values(err.constraints || {}) as string[],
      );
      return {
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        error: 'Unprocessable Entity',
        message: messages.join('; '),
        errors: messages,
        errorCode: 'VALIDATION_ERROR',
        timestamp,
        path,
        requestId,
      };
    }

    if (exception instanceof Stripe.errors.StripeInvalidRequestError) {
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        error: 'Bad Request',
        message: exception.message,
        errors: [],
        errorCode: 'STRIPE_INVALID_REQUEST',
        timestamp,
        path,
        requestId,
      };
    }

    if (exception instanceof Stripe.errors.StripeCardError) {
      return {
        statusCode: HttpStatus.PAYMENT_REQUIRED,
        error: 'Payment Required',
        message: exception.message,
        errors: [],
        errorCode: 'STRIPE_CARD_ERROR',
        timestamp,
        path,
        requestId,
      };
    }

    if (exception instanceof Stripe.errors.StripeError) {
      return {
        statusCode: HttpStatus.BAD_GATEWAY,
        error: 'Bad Gateway',
        message: 'Payment provider error — please try again',
        errors: [],
        errorCode: 'STRIPE_ERROR',
        timestamp,
        path,
        requestId,
      };
    }

    // Unknown errors — never expose internals
    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      error: 'Internal Server Error',
      message: 'An unexpected error occurred',
      errors: [],
      errorCode: 'INTERNAL_ERROR',
      timestamp,
      path,
      requestId,
    };
  }
}
