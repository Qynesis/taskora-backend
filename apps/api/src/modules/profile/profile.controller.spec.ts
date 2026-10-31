import { Test, TestingModule } from '@nestjs/testing';
import { ProfileController } from './profile.controller';
import { ProfileService } from './profile.service';

describe('ProfileController', () => {
  let controller: ProfileController;
  let service: {
    findOne: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    saveProfessionalDetails: jest.Mock;
    patchProfessionalDetails: jest.Mock;
    saveWorkInfo: jest.Mock;
    patchWorkInfo: jest.Mock;
    createEmployee: jest.Mock;
    patchEmployee: jest.Mock;
    saveBankDetails: jest.Mock;
    patchBankDetails: jest.Mock;
    createCertification: jest.Mock;
    patchCertification: jest.Mock;
  };

  beforeEach(async () => {
    service = {
      findOne: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      saveProfessionalDetails: jest.fn(),
      patchProfessionalDetails: jest.fn(),
      saveWorkInfo: jest.fn(),
      patchWorkInfo: jest.fn(),
      createEmployee: jest.fn(),
      patchEmployee: jest.fn(),
      saveBankDetails: jest.fn(),
      patchBankDetails: jest.fn(),
      createCertification: jest.fn(),
      patchCertification: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProfileController],
      providers: [{ provide: ProfileService, useValue: service }],
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

    controller = module.get<ProfileController>(ProfileController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should delegate getMe to profileService.findOne', async () => {
    service.findOne.mockResolvedValue({ id: 'p1' });

    const result = await controller.getMe({ id: 'u1' } as any);

    expect(service.findOne).toHaveBeenCalledWith('u1');
    expect(result.id).toBe('p1');
  });

  it('should expose `locked` (from nameLocked) for a provider and drop the raw nameLocked', async () => {
    service.findOne.mockResolvedValue({ id: 'p1', nameLocked: true } as any);

    const result: any = await controller.getMe({ id: 'u1', roles: ['PROVIDER'] } as any);

    expect(result.locked).toBe(true);
    expect(result.nameLocked).toBeUndefined();
  });

  it('should NOT expose `locked` for a non-provider (seeker)', async () => {
    service.findOne.mockResolvedValue({ id: 'p1', nameLocked: false } as any);

    const result: any = await controller.getMe({ id: 'u1', roles: ['SEEKER'] } as any);

    expect(result.locked).toBeUndefined();
    expect(result.nameLocked).toBeUndefined();
  });

  it('should delegate createProfile and return { id }', async () => {
    service.create.mockResolvedValue({ id: 'p1' });

    const result = await controller.createProfile({ firstName: 'John' } as any, { id: 'u1' } as any);

    expect(service.create).toHaveBeenCalledWith('u1', { firstName: 'John' });
    expect(result).toEqual({ id: 'p1' });
  });

  it('should delegate updateProfile and return { id }', async () => {
    service.update.mockResolvedValue({ id: 'p1' });

    const result = await controller.updateProfile({ firstName: 'Jane' } as any, { id: 'u1' } as any);

    expect(service.update).toHaveBeenCalledWith('u1', { firstName: 'Jane' });
    expect(result).toEqual({ id: 'p1' });
  });

  it('should delegate saveProfessionalDetails and return { id }', async () => {
    service.saveProfessionalDetails.mockResolvedValue({ id: 'pd-1' });

    const result = await controller.saveProfessionalDetails({} as any, { id: 'u1' } as any);

    expect(service.saveProfessionalDetails).toHaveBeenCalledWith('u1', {});
    expect(result).toEqual({ id: 'pd-1' });
  });

  it('should delegate patchProfessionalDetails and return { id }', async () => {
    service.patchProfessionalDetails.mockResolvedValue({ id: 'pd-1' });

    const result = await controller.patchProfessionalDetails({} as any, { id: 'u1' } as any);

    expect(service.patchProfessionalDetails).toHaveBeenCalledWith('u1', {});
    expect(result).toEqual({ id: 'pd-1' });
  });

  it('should delegate saveWorkInfo and return { id }', async () => {
    service.saveWorkInfo.mockResolvedValue({ id: 'wi-1', businessName: 'ACME' });

    const result = await controller.saveWorkInfo({} as any, { id: 'u1' } as any);

    expect(service.saveWorkInfo).toHaveBeenCalledWith('u1', {});
    expect(result).toEqual({ id: 'wi-1' });
  });

  it('should delegate patchWorkInfo and return { id }', async () => {
    service.patchWorkInfo.mockResolvedValue({ id: 'wi-1' });

    const result = await controller.patchWorkInfo({} as any, { id: 'u1' } as any);

    expect(service.patchWorkInfo).toHaveBeenCalledWith('u1', {});
    expect(result).toEqual({ id: 'wi-1' });
  });

  it('should delegate createEmployee and return { id }', async () => {
    service.createEmployee.mockResolvedValue({ id: 'emp-1' });

    const result = await controller.createEmployee({ name: 'Alice' } as any, { id: 'u1' } as any);

    expect(service.createEmployee).toHaveBeenCalledWith('u1', { name: 'Alice' });
    expect(result).toEqual({ id: 'emp-1' });
  });

  it('should delegate patchEmployee and return { id }', async () => {
    service.patchEmployee.mockResolvedValue({ id: 'emp-1' });

    const result = await controller.patchEmployee('emp-1', { name: 'Bob' } as any, { id: 'u1' } as any);

    expect(service.patchEmployee).toHaveBeenCalledWith('u1', 'emp-1', { name: 'Bob' });
    expect(result).toEqual({ id: 'emp-1' });
  });

  it('should delegate saveBankDetails and return { id }', async () => {
    service.saveBankDetails.mockResolvedValue({ id: 'bd-1', bankName: 'ANZ' });

    const mockReq = { headers: {}, socket: { remoteAddress: '127.0.0.1' } } as any;
    const result = await controller.saveBankDetails({} as any, { id: 'u1' } as any, mockReq);

    expect(service.saveBankDetails).toHaveBeenCalledWith('u1', {}, expect.any(String));
    expect(result).toEqual({ id: 'bd-1' });
  });

  it('should delegate patchBankDetails and return { id }', async () => {
    service.patchBankDetails.mockResolvedValue({ id: 'bd-1' });

    const result = await controller.patchBankDetails({} as any, { id: 'u1' } as any);

    expect(service.patchBankDetails).toHaveBeenCalledWith('u1', {});
    expect(result).toEqual({ id: 'bd-1' });
  });

  it('should delegate createCertification and return { id }', async () => {
    service.createCertification.mockResolvedValue({ id: 'cert-1' });

    const result = await controller.createCertification({ name: 'First Aid' } as any, { id: 'u1' } as any);

    expect(service.createCertification).toHaveBeenCalledWith('u1', { name: 'First Aid' });
    expect(result).toEqual({ id: 'cert-1' });
  });

  it('should delegate patchCertification and return { id }', async () => {
    service.patchCertification.mockResolvedValue({ id: 'cert-1' });

    const result = await controller.patchCertification('cert-1', { name: 'CPR' } as any, { id: 'u1' } as any);

    expect(service.patchCertification).toHaveBeenCalledWith('u1', 'cert-1', { name: 'CPR' });
    expect(result).toEqual({ id: 'cert-1' });
  });
});
