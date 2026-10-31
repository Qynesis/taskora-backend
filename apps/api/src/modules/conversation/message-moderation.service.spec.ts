import { Test, TestingModule } from '@nestjs/testing';
import { UnprocessableEntityException } from '@nestjs/common';
import { MessageModerationService } from './message-moderation.service';

describe('MessageModerationService', () => {
  let module: TestingModule;
  let service: MessageModerationService;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [MessageModerationService],
    }).compile();

    service = module.get<MessageModerationService>(MessageModerationService);
  });

  afterEach(() => module.close());

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should allow safe message content', () => {
    expect(() => service.validate('Hello, I can help with your booking tomorrow.')).not.toThrow();
  });

  it('should reject messages containing an email address', () => {
    expect(() => service.validate('Contact me at user@example.com')).toThrow(UnprocessableEntityException);
  });

  it('should reject messages containing a phone number', () => {
    expect(() => service.validate('My number is 0412 345 678')).toThrow(UnprocessableEntityException);
  });

  it('should reject messages containing a web link', () => {
    expect(() => service.validate('Please check https://example.com/details')).toThrow(
      UnprocessableEntityException,
    );
  });
});