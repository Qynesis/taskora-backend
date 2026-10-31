import { Test, TestingModule } from '@nestjs/testing';
import { SkillController } from './skill.controller';
import { SkillService } from './skill.service';

describe('SkillController', () => {
  let controller: SkillController;
  let service: { findAll: jest.Mock; create: jest.Mock };

  beforeEach(async () => {
    service = {
      findAll: jest.fn(),
      create: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SkillController],
      providers: [{ provide: SkillService, useValue: service }],
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

    controller = module.get<SkillController>(SkillController);
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
    service.create.mockResolvedValue({ id: 's1', name: 'Cleaning' });

    const result = await controller.create({ name: 'Cleaning' } as any);

    expect(service.create).toHaveBeenCalledWith({ name: 'Cleaning' });
    expect(result.id).toBe('s1');
  });
});