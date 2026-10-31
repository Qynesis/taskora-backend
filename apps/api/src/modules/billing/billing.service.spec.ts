import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ForbiddenException, GoneException, NotFoundException } from '@nestjs/common';
import { BillingService } from './billing.service';
import { StripeCustomer } from '../../database/entities/stripe-customer.entity';
import { Profile, User } from '../../database';
import { TransactionHelper } from '../../database/transaction.helper';
import { DomainEventEmitter } from '../../events/domain-event-emitter.service';
import { ConfigService } from '@nestjs/config';
import { StripeService } from '../stripe/stripe.service';
import { createMockRepository, createMockEventEmitter, createMockStripeService } from '../../../test/helpers/test-factory';

describe('BillingService', () => {
  let module: TestingModule;
  let service: BillingService;
  let stripeCustomerRepo: ReturnType<typeof createMockRepository>;
  let profileRepo: ReturnType<typeof createMockRepository>;
  let userRepo: ReturnType<typeof createMockRepository>;
  let txHelper: { run: jest.Mock };
  let stripeService: ReturnType<typeof createMockStripeService>;

  beforeEach(async () => {
    stripeCustomerRepo = createMockRepository();
    profileRepo = createMockRepository();
    userRepo = createMockRepository();
    txHelper = {
      run: jest.fn().mockImplementation(async (cb: (qr: any) => Promise<unknown>) => {
        const repo = {
          create: jest.fn().mockImplementation((x: any) => x),
          save: jest.fn().mockResolvedValue(undefined),
        };
        return cb({ manager: { getRepository: jest.fn().mockReturnValue(repo) } });
      }),
    };
    stripeService = createMockStripeService();

    module = await Test.createTestingModule({
      providers: [
        BillingService,
        { provide: TransactionHelper, useValue: txHelper },
        { provide: DomainEventEmitter, useValue: createMockEventEmitter() },
        { provide: ConfigService, useValue: {} },
        { provide: StripeService, useValue: stripeService },
        { provide: getRepositoryToken(StripeCustomer), useValue: stripeCustomerRepo },
        { provide: getRepositoryToken(Profile), useValue: profileRepo },
        { provide: getRepositoryToken(User), useValue: userRepo },
      ],
    }).compile();

    service = module.get<BillingService>(BillingService);
  });

  afterEach(() => module.close());

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createCustomer', () => {
    it('should return existing customer id when customer already exists (idempotent)', async () => {
      stripeCustomerRepo.findOne.mockResolvedValue({ id: 'existing', customerId: 'cus_existing' });

      const result = await service.createCustomer({ id: 'u1', email: 'u1@test.com' } as any);

      expect(result).toEqual({ customer_id: 'cus_existing' });
    });

    it('should throw ForbiddenException when profile is missing', async () => {
      stripeCustomerRepo.findOne.mockResolvedValue(null);
      profileRepo.findOne.mockResolvedValue(null);

      await expect(service.createCustomer({ id: 'u1', email: 'u1@test.com' } as any)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should create customer and return id', async () => {
      stripeCustomerRepo.findOne.mockResolvedValue(null);
      profileRepo.findOne.mockResolvedValue({ firstName: 'John', lastName: 'Doe' });
      stripeService.create.mockResolvedValue({ id: 'cus_123' });

      const result = await service.createCustomer({ id: 'u1', email: 'u1@test.com' } as any);

      expect(stripeService.create).toHaveBeenCalledWith('John Doe', 'u1@test.com', 'u1');
      expect(txHelper.run).toHaveBeenCalled();
      expect(result).toEqual({ customer_id: 'cus_123' });
    });
  });

  describe('getCustomer', () => {
    it('should throw NotFoundException when mapping is missing', async () => {
      stripeCustomerRepo.findOne.mockResolvedValue(null);
      await expect(service.getCustomer({ id: 'u1' } as any)).rejects.toThrow(NotFoundException);
    });

    it('should throw GoneException when stripe customer is deleted', async () => {
      stripeCustomerRepo.findOne.mockResolvedValue({ customerId: 'cus_123' });
      stripeService.customerRetrieve.mockResolvedValue({ deleted: true });

      await expect(service.getCustomer({ id: 'u1' } as any)).rejects.toThrow(GoneException);
    });
  });
});