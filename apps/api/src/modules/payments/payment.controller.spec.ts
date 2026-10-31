import { Test, TestingModule } from '@nestjs/testing';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';

describe('PaymentController', () => {
  let controller: PaymentController;
  let service: {
    getPaymentDetails: jest.Mock;
    getConnectStatus: jest.Mock;
    getSavedCards: jest.Mock;
    setDefaultCard: jest.Mock;
    processRefund: jest.Mock;
  };

  beforeEach(async () => {
    service = {
      getPaymentDetails: jest.fn(),
      getConnectStatus: jest.fn(),
      getSavedCards: jest.fn(),
      setDefaultCard: jest.fn(),
      processRefund: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PaymentController],
      providers: [{ provide: PaymentService, useValue: service }],
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

    controller = module.get<PaymentController>(PaymentController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should delegate getPaymentDetails by id', async () => {
    service.getPaymentDetails.mockResolvedValue({ id: 'p1' });

    const result = await controller.getPaymentDetails('p1', { id: 'u1', roles: ['SEEKER'] } as any);

    expect(service.getPaymentDetails).toHaveBeenCalledWith('p1', 'u1', ['SEEKER']);
    expect(result.id).toBe('p1');
  });

  it('should delegate getConnectStatus with user id', async () => {
    service.getConnectStatus.mockResolvedValue({ chargesEnabled: true, payoutsEnabled: false });

    const result = await controller.getConnectStatus({ id: 'u1' } as any);

    expect(service.getConnectStatus).toHaveBeenCalledWith({ id: 'u1' });
    expect(result.chargesEnabled).toBe(true);
  });

  it('should delegate getSavedCards with user id', async () => {
    const cards = [{ id: 'card-1', brand: 'visa', last4: '4242' }];
    service.getSavedCards.mockResolvedValue(cards);

    const result = await controller.getSavedCards({ id: 'u1' } as any);

    expect(service.getSavedCards).toHaveBeenCalledWith('u1');
    expect(result).toEqual(cards);
  });

  it('should delegate setDefaultCard and return the card id', async () => {
    service.setDefaultCard.mockResolvedValue(true);

    const result = await controller.setDefaultCard(
      'card-1',
      { is_default: true } as any,
      { id: 'u1' } as any,
    );

    expect(service.setDefaultCard).toHaveBeenCalledWith('u1', 'card-1', true);
    expect(result).toEqual({ id: 'card-1' });
  });

  it('should return the card id when unsetting default', async () => {
    service.setDefaultCard.mockResolvedValue(false);

    const result = await controller.setDefaultCard(
      'card-1',
      { is_default: false } as any,
      { id: 'u1' } as any,
    );

    expect(service.setDefaultCard).toHaveBeenCalledWith('u1', 'card-1', false);
    expect(result).toEqual({ id: 'card-1' });
  });

  it('should delegate refund to processRefund with payment id and provider id', async () => {
    service.processRefund.mockResolvedValue({
      stripeRefundId: 're_test123',
      amount: 15000,
      status: 'succeeded',
    });

    const result = await controller.refund('pay-1', { id: 'provider-1' } as any);

    expect(service.processRefund).toHaveBeenCalledWith('pay-1', 'provider-1');
    expect(result.stripeRefundId).toBe('re_test123');
    expect(result.amount).toBe(15000);
  });
});
