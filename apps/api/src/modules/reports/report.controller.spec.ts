import { Test, TestingModule } from '@nestjs/testing';
import { ReportController } from './report.controller';
import { ReportService } from './report.service';

describe('ReportController', () => {
  let controller: ReportController;
  let service: { findReportableUsers: jest.Mock; create: jest.Mock };

  beforeEach(async () => {
    service = { findReportableUsers: jest.fn(), create: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReportController],
      providers: [{ provide: ReportService, useValue: service }],
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

    controller = module.get<ReportController>(ReportController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should delegate findReportableUsers with current user id', async () => {
    service.findReportableUsers.mockResolvedValue({ data: [], total: 0, page: 1, limit: 10 });

    const result = await controller.findReportableUsers({ page: 1, limit: 10 } as any, { id: 'u1' } as any);

    expect(service.findReportableUsers).toHaveBeenCalledWith('u1', expect.any(Object));
    expect(result.total).toBe(0);
  });

  it('should delegate create with current user id', async () => {
    service.create.mockResolvedValue({ id: 'r1' });

    const result = await controller.create({ reportKind: 'spam' } as any, { id: 'u1' } as any);

    expect(service.create).toHaveBeenCalledWith({ reportKind: 'spam' }, 'u1');
    expect(result.id).toBe('r1');
  });
});