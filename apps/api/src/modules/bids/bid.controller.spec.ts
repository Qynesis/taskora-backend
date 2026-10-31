import { Test, TestingModule } from '@nestjs/testing';
import { BidController } from './bid.controller';
import { BidService } from './bid.service';

describe('BidController', () => {
  let controller: BidController;
  let service: { findMyBids: jest.Mock; update: jest.Mock; decline: jest.Mock };

  beforeEach(async () => {
    service = { findMyBids: jest.fn(), update: jest.fn(), decline: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [BidController],
      providers: [{ provide: BidService, useValue: service }],
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

    controller = module.get<BidController>(BidController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should delegate getMyBids to service', async () => {
    service.findMyBids.mockResolvedValue({ data: [], total: 0, page: 1, limit: 10 });

    const result = await controller.getMyBids({ id: 'u1' } as any, { page: 1, limit: 10 } as any);

    expect(service.findMyBids).toHaveBeenCalledWith('u1', expect.any(Object));
    expect(result.total).toBe(0);
  });

  it('should delegate update to service', async () => {
    service.update.mockResolvedValue({ id: 'b1', job: { id: 'job-1', seeker: { id: 'seeker-1' } } });

    const result = await controller.update('b1', { amount: 200 } as any, { id: 'u1' } as any, {} as any);

    expect(service.update).toHaveBeenCalledWith('b1', { amount: 200 }, 'u1');
    expect(result.id).toBe('b1');
  });

  it('should delegate decline to service and return { id }', async () => {
    service.decline.mockResolvedValue({ id: 'b1', job: { id: 'job-1' }, provider: { id: 'prov-1' } });

    const result = await controller.decline('b1', { id: 'seeker-1' } as any, {} as any);

    expect(service.decline).toHaveBeenCalledWith('b1', 'seeker-1');
    expect(result).toEqual({ id: 'b1' });
  });
});