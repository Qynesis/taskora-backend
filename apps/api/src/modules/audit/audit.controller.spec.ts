import { Test, TestingModule } from '@nestjs/testing';
import { AuditController } from './audit.controller';
import { AuditService } from './audit.service';

describe('AuditController', () => {
  let controller: AuditController;
  let service: { findAll: jest.Mock; findOne: jest.Mock };

  beforeEach(async () => {
    service = { findAll: jest.fn(), findOne: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuditController],
      providers: [{ provide: AuditService, useValue: service }],
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

    controller = module.get<AuditController>(AuditController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should delegate findAll', async () => {
    service.findAll.mockResolvedValue({ data: [], total: 0, page: 1, limit: 10 });

    const result = await controller.findAll({ page: 1, limit: 10 } as any);

    expect(service.findAll).toHaveBeenCalledWith(expect.any(Object));
    expect(result.total).toBe(0);
  });

  it('should delegate findOne', async () => {
    service.findOne.mockResolvedValue({ id: 'a1' });

    const result = await controller.findOne('a1');

    expect(service.findOne).toHaveBeenCalledWith('a1');
    expect(result.id).toBe('a1');
  });
});