import { HttpException, HttpStatus, ArgumentsHost, Logger } from '@nestjs/common';
import { GlobalExceptionFilter } from './global-exception.filter';
import { EntityNotFoundError, QueryFailedError } from 'typeorm';

describe('GlobalExceptionFilter', () => {
  let filter: GlobalExceptionFilter;
  let mockResponse: { status: jest.Mock; json: jest.Mock };
  let mockRequest: { url: string; headers: Record<string, string> };
  let mockHost: ArgumentsHost;

  beforeEach(() => {
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);

    filter = new GlobalExceptionFilter();
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    mockRequest = {
      url: '/test',
      headers: { 'x-request-id': 'req-123' },
    };
    mockHost = {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
        getResponse: () => mockResponse,
      }),
    } as unknown as ArgumentsHost;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should handle HttpException', () => {
    const exception = new HttpException('Bad request', HttpStatus.BAD_REQUEST);

    filter.catch(exception, mockHost);

    expect(mockResponse.status).toHaveBeenCalledWith(400);
    const body = mockResponse.json.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(body['statusCode']).toBe(400);
    expect(body['requestId']).toBe('req-123');
    expect(body['errorCode']).toBe('HTTP_EXCEPTION');
    expect(body['message']).toBe('Bad request');
    expect(body['errors']).toEqual([]);
  });

  it('should normalize a ValidationPipe array message into a joined string plus errors[]', () => {
    // This is the shape NestJS ValidationPipe throws: BadRequestException with a string[] message.
    const exception = new HttpException(
      { message: ['phone must be a valid phone number', 'email must be an email'], error: 'Bad Request' },
      HttpStatus.BAD_REQUEST,
    );

    filter.catch(exception, mockHost);

    const body = mockResponse.json.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(body['message']).toBe('phone must be a valid phone number; email must be an email');
    expect(body['errors']).toEqual(['phone must be a valid phone number', 'email must be an email']);
    expect(body['errorCode']).toBe('VALIDATION_ERROR');
  });

  it('should surface a thrower-supplied errorCode from an HttpException body', () => {
    const exception = new HttpException(
      { message: 'Please connect your Stripe payout account before bidding.', errorCode: 'STRIPE_ACCOUNT_NOT_CONNECTED' },
      HttpStatus.BAD_REQUEST,
    );

    filter.catch(exception, mockHost);

    const body = mockResponse.json.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(body['errorCode']).toBe('STRIPE_ACCOUNT_NOT_CONNECTED');
    expect(body['message']).toBe('Please connect your Stripe payout account before bidding.');
    expect(body['errors']).toEqual([]);
  });

  it('should ignore a non-string errorCode and fall back to the generic code', () => {
    const exception = new HttpException({ message: 'nope', errorCode: 42 }, HttpStatus.BAD_REQUEST);

    filter.catch(exception, mockHost);

    const body = mockResponse.json.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(body['errorCode']).toBe('HTTP_EXCEPTION');
  });

  it('should handle EntityNotFoundError as 404', () => {
    const exception = new EntityNotFoundError('Example', { id: '1' });

    filter.catch(exception, mockHost);

    expect(mockResponse.status).toHaveBeenCalledWith(404);
  });

  it('should handle QueryFailedError with unique constraint as 409', () => {
    const exception = new QueryFailedError('INSERT', [], new Error('duplicate key'));
    (exception as unknown as { driverError: { code: string } }).driverError = { code: '23505' };

    filter.catch(exception, mockHost);

    expect(mockResponse.status).toHaveBeenCalledWith(409);
  });

  it('should handle QueryFailedError without unique constraint as 400', () => {
    const exception = new QueryFailedError('INSERT', [], new Error('some error'));
    (exception as unknown as { driverError: { code: string } }).driverError = { code: '23502' };

    filter.catch(exception, mockHost);

    expect(mockResponse.status).toHaveBeenCalledWith(400);
  });

  it('should handle unknown errors as 500 with safe message', () => {
    const exception = new Error('Internal secret error');

    filter.catch(exception, mockHost);

    expect(mockResponse.status).toHaveBeenCalledWith(500);
    const body = mockResponse.json.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(body['message']).toBe('An unexpected error occurred');
    expect(body['errors']).toEqual([]);
  });
});
