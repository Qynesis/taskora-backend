import { Test, TestingModule } from '@nestjs/testing';
import { VerificationController } from './verification.controller';
import { VerificationService } from './verification.service';

describe('VerificationController', () => {
  let controller: VerificationController;
  let service: {
    getCase:        jest.Mock;
    submitBusiness: jest.Mock;
  };

  beforeEach(async () => {
    service = {
      getCase:        jest.fn(),
      submitBusiness: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [VerificationController],
      providers: [{ provide: VerificationService, useValue: service }],
    })
      .useMocker((_token) =>
        new Proxy({}, { get: (_t, p) => (p === 'then' ? undefined : jest.fn()) }),
      )
      .compile();

    controller = module.get<VerificationController>(VerificationController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // ── getCase ───────────────────────────────────────────────────────────────

  it('should delegate getCase with current user id', async () => {
    service.getCase.mockResolvedValue({ status: 'pending', steps: [] });

    const result = await controller.getCase({ id: 'u1' } as any);

    expect(service.getCase).toHaveBeenCalledWith('u1');
    expect(result).toEqual({ status: 'pending', steps: [] });
  });

  // ── submitBusiness ────────────────────────────────────────────────────────

  it('should delegate submitBusiness with current user id', async () => {
    service.submitBusiness.mockResolvedValue({ id: 'step-1' });

    const dto = { abn: '12345678901', fileUrl: 'https://cdn.example.com/abn.pdf' };
    const result = await controller.submitBusiness(dto as any, { id: 'u1' } as any);

    expect(service.submitBusiness).toHaveBeenCalledWith('u1', dto);
    expect(result.id).toBe('step-1');
  });

});
