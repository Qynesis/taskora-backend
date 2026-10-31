import { Test, TestingModule } from '@nestjs/testing';
import { SelectionController } from './selection.controller';
import { SelectionService } from './selection.service';

describe('SelectionController', () => {
  let controller: SelectionController;
  let service: { create: jest.Mock };

  beforeEach(async () => {
    service = { create: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SelectionController],
      providers: [{ provide: SelectionService, useValue: service }],
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

    controller = module.get<SelectionController>(SelectionController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should delegate selectProvider to selectionService.create', async () => {
    service.create.mockResolvedValue({ id: 'sel-1' });

    const result = await controller.selectProvider('job-1', { bidId: 'bid-1' } as any, { id: 'u1' } as any);

    expect(service.create).toHaveBeenCalledWith({ bidId: 'bid-1' }, 'u1', 'job-1');
    expect(result.id).toBe('sel-1');
  });
});