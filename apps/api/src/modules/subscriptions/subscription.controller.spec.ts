import { Test, TestingModule } from '@nestjs/testing';
import { SubscriptionController } from './subscription.controller';
import { SubscriptionService } from './subscription.service';
import { CheckoutSubscriptionDto } from './dto/checkout-subscription.dto';
import { AuthenticatedUser } from '@app/shared-types';

const JOB_ID = 'job-123';
const SEEKER_ID = '00000000-0000-0000-0000-000000000001';

describe('SubscriptionController', () => {
  let controller: SubscriptionController;
  let service: {
    initiateJobSubscriptionCheckout: jest.Mock;
    getSubscriptionById: jest.Mock;
    cancelSubscription: jest.Mock;
    getSubscriptionPeriodDetails: jest.Mock;
  };

  const mockAuthUser: AuthenticatedUser = {
    id: SEEKER_ID,
    email: 'seeker@example.com',
    roles: ['SEEKER'],
    metadata: {},
  };

  beforeEach(async () => {
    service = {
      initiateJobSubscriptionCheckout: jest.fn(),
      getSubscriptionById: jest.fn(),
      cancelSubscription: jest.fn(),
      getSubscriptionPeriodDetails: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SubscriptionController],
      providers: [{ provide: SubscriptionService, useValue: service }],
    })
      .useMocker((_token) =>
        new Proxy({}, { get: (_t, p) => (p === 'then' ? undefined : jest.fn()) }),
      )
      .compile();

    controller = module.get<SubscriptionController>(SubscriptionController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('POST /subscriptions/checkout', () => {
    it('should create checkout session for a job', async () => {
      const dto: CheckoutSubscriptionDto = { jobId: JOB_ID };

      service.initiateJobSubscriptionCheckout.mockResolvedValue({
        url: 'https://checkout.stripe.com/session-123',
        sessionId: 'cs_test_123',
      });

      const result = await controller.checkout(dto, mockAuthUser);

      expect(service.initiateJobSubscriptionCheckout).toHaveBeenCalledWith(JOB_ID, SEEKER_ID);
      expect(result).toEqual({
        url: 'https://checkout.stripe.com/session-123',
        sessionId: 'cs_test_123',
      });
    });

    it('should pass authenticated user ID to service', async () => {
      const dto: CheckoutSubscriptionDto = { jobId: JOB_ID };
      const differentUser: AuthenticatedUser = {
        id: '00000000-0000-0000-0000-000000000099',
        email: 'other@example.com',
        roles: ['SEEKER'],
        metadata: {},
      };

      service.initiateJobSubscriptionCheckout.mockResolvedValue({
        url: 'https://checkout.stripe.com/session-123',
        sessionId: 'cs_test_123',
      });

      await controller.checkout(dto, differentUser);

      expect(service.initiateJobSubscriptionCheckout).toHaveBeenCalledWith(JOB_ID, differentUser.id);
    });

    it('should return checkout URL and session ID', async () => {
      const dto: CheckoutSubscriptionDto = { jobId: JOB_ID };
      const expectedResponse = {
        url: 'https://checkout.stripe.com/pay/cs_123456789',
        sessionId: 'cs_123456789',
      };

      service.initiateJobSubscriptionCheckout.mockResolvedValue(expectedResponse);

      const result = await controller.checkout(dto, mockAuthUser);

      expect(result).toEqual(expectedResponse);
      expect(result.url).toMatch(/^https:\/\/checkout\.stripe\.com/);
      expect(result.sessionId).toBeDefined();
    });

    it('should propagate errors from service', async () => {
      const dto: CheckoutSubscriptionDto = { jobId: JOB_ID };

      service.initiateJobSubscriptionCheckout.mockRejectedValue(new Error('Job not found'));

      await expect(controller.checkout(dto, mockAuthUser)).rejects.toThrow('Job not found');
    });
  });
});
