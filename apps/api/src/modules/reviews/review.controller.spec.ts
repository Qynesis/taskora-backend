import { Test, TestingModule } from '@nestjs/testing';
import { ReviewController } from './review.controller';
import { ReviewService } from './review.service';

describe('ReviewController', () => {
  let controller: ReviewController;
  let service: { create: jest.Mock; findByProvider: jest.Mock };

  beforeEach(async () => {
    service = {
      create: jest.fn(),
      findByProvider: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReviewController],
      providers: [{ provide: ReviewService, useValue: service }],
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

    controller = module.get<ReviewController>(ReviewController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should delegate create to service with current user id and stamp cache-invalidation ids on req', async () => {
    service.create.mockResolvedValue({ review: { id: 'r1', providerId: 'user-1' }, providerProfileId: 'profile-1' });
    const req: any = {};

    const result = await controller.create({ jobId: 'j1', rating: 5 } as any, { id: 'u1' } as any, req);

    expect(service.create).toHaveBeenCalledWith('u1', { jobId: 'j1', rating: 5 });
    expect(result.id).toBe('r1');
    // Both ids are stamped so @InvalidateCache can clear the user-id and profile-id keyed caches.
    expect(req._providerId).toBe('user-1');
    expect(req._providerProfileId).toBe('profile-1');
  });

  it('should delegate getByProvider to service', async () => {
    service.findByProvider.mockResolvedValue({ data: [], total: 0, page: 1, limit: 10 });

    const result = await controller.getByProvider('p1', { page: 1, limit: 10 } as any);

    expect(service.findByProvider).toHaveBeenCalledWith('p1', expect.any(Object));
    expect(result.total).toBe(0);
  });
});