import { Test, TestingModule } from '@nestjs/testing';
import { WarningThreadController } from './warning-thread.controller';
import { WarningThreadService } from './warning-thread.service';

describe('WarningThreadController', () => {
  let controller: WarningThreadController;
  let service: { findForUser: jest.Mock; findMessages: jest.Mock; sendUserMessage: jest.Mock };

  beforeEach(async () => {
    service = {
      findForUser: jest.fn(),
      findMessages: jest.fn(),
      sendUserMessage: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [WarningThreadController],
      providers: [{ provide: WarningThreadService, useValue: service }],
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

    controller = module.get<WarningThreadController>(WarningThreadController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should delegate findMine to service', async () => {
    service.findForUser.mockResolvedValue({ data: [], total: 0, page: 1, limit: 10 });

    const result = await controller.findMine({ id: 'u1' } as any, { page: 1, limit: 10 } as any);

    expect(service.findForUser).toHaveBeenCalledWith('u1', expect.any(Object));
    expect(result.total).toBe(0);
  });

  it('should delegate sendMessage to service', async () => {
    service.sendUserMessage.mockResolvedValue({ id: 'm1' });

    const result = await controller.sendMessage('w1', { body: 'reply' } as any, { id: 'u1' } as any);

    expect(service.sendUserMessage).toHaveBeenCalledWith('w1', 'u1', { body: 'reply' });
    expect(result.id).toBe('m1');
  });
});