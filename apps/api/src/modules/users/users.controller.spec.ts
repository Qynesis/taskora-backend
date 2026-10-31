import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

describe('UsersController', () => {
  let controller: UsersController;
  let service: { ensureSynced: jest.Mock; getNotificationSettings: jest.Mock; updateNotificationSettings: jest.Mock };

  beforeEach(async () => {
    service = {
      ensureSynced: jest.fn(),
      getNotificationSettings: jest.fn(),
      updateNotificationSettings: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: service }],
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

    controller = module.get<UsersController>(UsersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should delegate sync to ensureSynced and return { id }', async () => {
    service.ensureSynced.mockResolvedValue({ id: 'u1' });

    const user = {
      id: 'u1',
      email: 'u1@test.com',
      metadata: { user_metadata: { role: 'seeker', email_verified: true } },
    } as any;
    const result = await controller.sync(user);

    expect(service.ensureSynced).toHaveBeenCalledWith(user);
    expect(result).toEqual({ id: 'u1' });
  });

  it('should delegate updateNotificationSettings', async () => {
    service.updateNotificationSettings.mockResolvedValue({ id: 'n1' });

    const result = await controller.updateNotificationSettings(
      { marketingNotificationsEnabled: true } as any,
      { id: 'u1' } as any,
    );

    expect(service.updateNotificationSettings).toHaveBeenCalledWith('u1', { marketingNotificationsEnabled: true });
    expect(result.id).toBe('n1');
  });
});