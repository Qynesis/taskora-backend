import { Test, TestingModule } from '@nestjs/testing';
import { BillingController } from './billing.controller';
import { BillingService } from './billing.service';

describe('BillingController', () => {
  let controller: BillingController;
  let service: { createCustomer: jest.Mock; getCustomer: jest.Mock };

  beforeEach(async () => {
    service = {
      createCustomer: jest.fn(),
      getCustomer: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [BillingController],
      providers: [{ provide: BillingService, useValue: service }],
    })
      .useMocker((_token) =>
        new Proxy(
          {},
          {
            get: (_target, prop) => (prop === 'then' ? undefined : jest.fn()),
          },
        ),
      )
      .compile();

    controller = module.get<BillingController>(BillingController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should build create-customer dto from current user', async () => {
    service.createCustomer.mockResolvedValue({ customer_id: 'cus_1' });

    const result = await controller.createCustomer({ id: 'u1', email: 'u1@test.com' } as any);

    expect(service.createCustomer).toHaveBeenCalledWith({ id: 'u1', email: 'u1@test.com' });
    expect(result.customer_id).toBe('cus_1');
  });

  it('should delegate getCustomer using current user id', async () => {
    service.getCustomer.mockResolvedValue({ customerId: 'cus_1' });

    const result = await controller.getCustomer({ id: 'u1' } as any);

    expect(service.getCustomer).toHaveBeenCalledWith({ id: 'u1' });
    expect(result.customerId).toBe('cus_1');
  });
});