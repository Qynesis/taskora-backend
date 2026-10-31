import { Test, TestingModule } from '@nestjs/testing';
import { SupportTicketController } from './support-ticket.controller';
import { SupportTicketService } from './support-ticket.service';

describe('SupportTicketController', () => {
  let controller: SupportTicketController;
  let service: { findForUser: jest.Mock; create: jest.Mock; sendUserMessage: jest.Mock };

  beforeEach(async () => {
    service = {
      findForUser: jest.fn(),
      create: jest.fn(),
      sendUserMessage: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SupportTicketController],
      providers: [{ provide: SupportTicketService, useValue: service }],
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

    controller = module.get<SupportTicketController>(SupportTicketController);
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

  it('should delegate create to service and return { id }', async () => {
    service.create.mockResolvedValue({ id: 't1', subject: 'Login issue' });

    const result = await controller.create({ subject: 'Login issue' } as any, { id: 'u1' } as any);

    expect(service.create).toHaveBeenCalledWith('u1', { subject: 'Login issue' });
    expect(result).toEqual({ id: 't1' });
  });

  it('should delegate sendMessage to service', async () => {
    service.sendUserMessage.mockResolvedValue({ id: 'm1' });

    const result = await controller.sendMessage('t1', { body: 'hello' } as any, { id: 'u1' } as any);

    expect(service.sendUserMessage).toHaveBeenCalledWith('t1', 'u1', { body: 'hello' });
    expect(result.id).toBe('m1');
  });
});