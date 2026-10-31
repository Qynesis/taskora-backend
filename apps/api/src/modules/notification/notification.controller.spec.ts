import { Test, TestingModule } from '@nestjs/testing';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';

describe('NotificationController', () => {
  let controller: NotificationController;
  let service: { findForUser: jest.Mock; registerToken: jest.Mock; markAllRead: jest.Mock };

  beforeEach(async () => {
    service = { findForUser: jest.fn(), registerToken: jest.fn(), markAllRead: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationController],
      providers: [{ provide: NotificationService, useValue: service }],
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

    controller = module.get<NotificationController>(NotificationController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should delegate findMine to service', async () => {
    service.findForUser.mockResolvedValue({ data: [], total: 0, page: 1, limit: 10 });

    const result = await controller.findMine({ id: 'u1' } as any, { page: 1, limit: 10 } as any);

    expect(service.findForUser).toHaveBeenCalledWith('u1', expect.any(Object));
    expect(result.total).toBe(0);
  });

  it('should delegate registerToken to service and return id', async () => {
    service.registerToken.mockResolvedValue({ id: 'tok-1' });

    const result = await controller.registerToken({ id: 'u1' } as any, { token: 'fcm-1' } as any);

    expect(service.registerToken).toHaveBeenCalledWith('u1', { token: 'fcm-1' });
    expect(result).toEqual({ id: 'tok-1' });
  });

  it('should delegate markAllRead to service and return void', async () => {
    service.markAllRead.mockResolvedValue(undefined);

    const result = await controller.markAllRead({ id: 'u1' } as any);

    expect(service.markAllRead).toHaveBeenCalledWith('u1');
    expect(result).toBeUndefined();
  });
});