import { Test, TestingModule } from '@nestjs/testing';
import { ConversationController } from './conversation.controller';
import { ConversationService } from './conversation.service';

describe('ConversationController', () => {
  let controller: ConversationController;
  let service: { findInbox: jest.Mock; sendMessage: jest.Mock };

  beforeEach(async () => {
    service = { findInbox: jest.fn(), sendMessage: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ConversationController],
      providers: [{ provide: ConversationService, useValue: service }],
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

    controller = module.get<ConversationController>(ConversationController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should delegate findInbox with current user id', async () => {
    service.findInbox.mockResolvedValue({ data: [], total: 0, page: 1, limit: 10 });

    const result = await controller.findInbox({ id: 'u1' } as any, { page: 1, limit: 10 } as any);

    expect(service.findInbox).toHaveBeenCalledWith('u1', expect.any(Object));
    expect(result.total).toBe(0);
  });

  it('should delegate sendMessage with conversation and user ids', async () => {
    service.sendMessage.mockResolvedValue({ id: 'm1' });

    const result = await controller.sendMessage('conv1', { id: 'u1' } as any, { body: 'hello' } as any);

    expect(service.sendMessage).toHaveBeenCalledWith('conv1', 'u1', { body: 'hello' });
    expect(result.id).toBe('m1');
  });
});