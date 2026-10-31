import { Test, TestingModule } from '@nestjs/testing';
import { ProvidersController } from './providers.controller';
import { ProfileService } from './profile.service';

describe('ProvidersController', () => {
  let controller: ProvidersController;
  let service: { findProviders: jest.Mock; addFavourite: jest.Mock };

  beforeEach(async () => {
    service = { findProviders: jest.fn(), addFavourite: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProvidersController],
      providers: [{ provide: ProfileService, useValue: service }],
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

    controller = module.get<ProvidersController>(ProvidersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should delegate findAll to profileService.findProviders', async () => {
    service.findProviders.mockResolvedValue({ data: [], total: 0, page: 1, limit: 10 });

    const result = await controller.findAll({ id: 'u1' } as any, { page: 1, limit: 10 } as any);

    expect(service.findProviders).toHaveBeenCalledWith('u1', expect.any(Object));
    expect(result.total).toBe(0);
  });

  it('should delegate addFavourite to profileService', async () => {
    service.addFavourite.mockResolvedValue(undefined);

    const result = await controller.addFavourite({ id: 'u1' } as any, 'provider-1');

    expect(service.addFavourite).toHaveBeenCalledWith('u1', 'provider-1');
    expect(result).toBeUndefined();
  });
});