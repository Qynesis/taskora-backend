import { Test, TestingModule } from '@nestjs/testing';
import { BookingController } from './booking.controller';
import { BookingService } from './booking.service';

describe('BookingController', () => {
  let controller: BookingController;
  let service: {
    create: jest.Mock;
    findSeekerBookings: jest.Mock;
    updateStatus: jest.Mock;
  };

  beforeEach(async () => {
    service = {
      create: jest.fn(),
      findSeekerBookings: jest.fn(),
      updateStatus: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [BookingController],
      providers: [{ provide: BookingService, useValue: service }],
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

    controller = module.get<BookingController>(BookingController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should delegate create to service with seeker id', async () => {
    service.create.mockResolvedValue({ id: 'b1' });

    const result = await controller.create({ providerProfileId: 'profile-1', description: 'Need cleaner' } as any, {
      id: 'u1',
    } as any);

    expect(service.create).toHaveBeenCalledWith('u1', expect.objectContaining({ providerProfileId: 'profile-1' }));
    expect(result.id).toBe('b1');
  });

  it('should delegate updateStatus for provider', async () => {
    service.updateStatus.mockResolvedValue({ id: 'b1', status: 'in_progress' });

    const result = await controller.updateStatus(
      'b1',
      { status: 'in_progress' } as any,
      { id: 'provider-1' } as any,
    );

    expect(service.updateStatus).toHaveBeenCalledWith('provider-1', 'b1', 'in_progress');
    expect(result.id).toBe('b1');
  });
});