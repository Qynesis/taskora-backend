import { Test, TestingModule } from '@nestjs/testing';
import { CategoryController } from './category.controller';
import { CategoryService } from './category.service';

describe('CategoryController', () => {
  let controller: CategoryController;
  let service: { findAll: jest.Mock; create: jest.Mock; findNames: jest.Mock };

  beforeEach(async () => {
    service = { findAll: jest.fn(), create: jest.fn(), findNames: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CategoryController],
      providers: [{ provide: CategoryService, useValue: service }],
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

    controller = module.get<CategoryController>(CategoryController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should delegate findAll to service', async () => {
    service.findAll.mockResolvedValue({ data: [], total: 0, page: 1, limit: 10 });

    const result = await controller.findAll({ page: 1, limit: 10 } as any);

    expect(service.findAll).toHaveBeenCalledWith(expect.any(Object));
    expect(result.total).toBe(0);
  });

  it('should delegate create to service', async () => {
    service.create.mockResolvedValue({ id: 'c1', name: 'Cleaning' });

    const result = await controller.create({ name: 'Cleaning' } as any);

    expect(service.create).toHaveBeenCalledWith({ name: 'Cleaning' });
    expect(result.id).toBe('c1');
  });

  it('should delegate findNames to service', async () => {
    const names = [{ id: 'c1', name: 'Cleaning' }, { id: 'c2', name: 'Gardening' }];
    service.findNames.mockResolvedValue(names);

    const result = await controller.findNames({ page: 1, limit: 10 } as any);

    expect(service.findNames).toHaveBeenCalledWith(expect.any(Object));
    expect(result).toEqual(names);
  });
});