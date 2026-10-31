import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { VerificationService } from './verification.service';
import { Profile } from '../../database/entities/profile.entity';
import { ProviderVerificationCase } from '../../database/entities/provider_verification_cases.entity';
import { ProviderVerificationStep } from '../../database/entities/provider_verification_steps.entity';
import { ProviderVerificationStepFile } from '../../database/entities/provider_verification_step_files.entity';
import { TransactionHelper } from '../../database/transaction.helper';
import { DomainEventEmitter } from '../../events/domain-event-emitter.service';
import { StripeService } from '../stripe/stripe.service';
import { AppCacheService } from '../../cache/cache.service';
import { VerificationStatus, VerificationStepType } from '../../database/common/enum';
import {
  createMockRepository,
  createMockTransactionHelper,
  createMockEventEmitter,
} from '../../../test/helpers/test-factory';

describe('VerificationService', () => {
  let module: TestingModule;
  let service: VerificationService;
  let profileRepo: ReturnType<typeof createMockRepository>;
  let caseRepo: ReturnType<typeof createMockRepository>;
  let stepRepo: ReturnType<typeof createMockRepository>;

  beforeEach(async () => {
    profileRepo  = createMockRepository();
    caseRepo     = createMockRepository();
    stepRepo     = createMockRepository();

    module = await Test.createTestingModule({
      providers: [
        VerificationService,
        { provide: getRepositoryToken(Profile),          useValue: profileRepo },
        { provide: getRepositoryToken(ProviderVerificationCase),     useValue: caseRepo },
        { provide: getRepositoryToken(ProviderVerificationStep),     useValue: stepRepo },
        { provide: getRepositoryToken(ProviderVerificationStepFile), useValue: createMockRepository() },
        { provide: TransactionHelper,  useValue: createMockTransactionHelper() },
        { provide: DomainEventEmitter, useValue: createMockEventEmitter() },
        {
          provide: StripeService,
          useValue: { createIdentityVerificationSession: jest.fn() },
        },
        { provide: ConfigService, useValue: { get: jest.fn() } },
        { provide: AppCacheService, useValue: { delByPrefix: jest.fn(), del: jest.fn() } },
      ],
    }).compile();

    service = module.get<VerificationService>(VerificationService);
  });

  afterEach(() => module.close());

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ── getCase ───────────────────────────────────────────────────────────────

  it('should throw NotFoundException when profile is missing', async () => {
    profileRepo.findOne.mockResolvedValue(null);

    await expect(service.getCase('missing-user')).rejects.toThrow(NotFoundException);
  });

  it('should throw NotFoundException when verification case is missing', async () => {
    profileRepo.findOne.mockResolvedValue({ id: 'profile-1' });
    caseRepo.findOne.mockResolvedValue(null);

    await expect(service.getCase('user-1')).rejects.toThrow(NotFoundException);
  });

  describe('reviewStep name lock', () => {
    const identityStep = () => ({
      id: 'step-1',
      stepType: VerificationStepType.IDENTITY,
      case: { profileId: 'profile-1' },
      files: [],
    });

    beforeEach(() => {
      stepRepo.save.mockImplementation(async (s: any) => s);
      stepRepo.find.mockResolvedValue([]);
      caseRepo.update.mockResolvedValue(undefined);
      profileRepo.update.mockResolvedValue(undefined);
    });

    it('locks the name when the IDENTITY step is approved', async () => {
      stepRepo.findOne.mockResolvedValue(identityStep());

      await service.reviewStep('step-1', VerificationStatus.APPROVED);

      expect(profileRepo.update).toHaveBeenCalledWith(
        { id: 'profile-1' },
        { nameLocked: true },
      );
    });

    it('unlocks the name (does not lock) when the IDENTITY step is rejected', async () => {
      stepRepo.findOne.mockResolvedValue(identityStep());

      await service.reviewStep('step-1', VerificationStatus.REJECTED);

      expect(profileRepo.update).toHaveBeenCalledWith(
        { id: 'profile-1' },
        { nameLocked: false },
      );
    });

    it('does not touch the name lock for non-identity steps', async () => {
      stepRepo.findOne.mockResolvedValue({ ...identityStep(), stepType: VerificationStepType.RIGHT_TO_WORK });

      await service.reviewStep('step-1', VerificationStatus.APPROVED);

      expect(profileRepo.update).not.toHaveBeenCalled();
    });
  });

});
