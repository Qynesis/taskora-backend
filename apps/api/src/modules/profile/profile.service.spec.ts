import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { ProfileService } from './profile.service';
import { Profile } from '../../database/entities/profile.entity';
import { ProviderProfessionalDetails } from '../../database/entities/provider_professional_details.entity';
import { ProviderWorkInfo } from '../../database/entities/provider_work_info.entity';
import { ProviderCategory } from '../../database/entities/provider-category.entity';
import { ProviderSkill } from '../../database/entities/provider-skill.entity';
import { ProviderMedia } from '../../database/entities/provider_media.entity';
import { ProviderEmployee } from '../../database/entities/provider_employee.entity';
import { ProviderBankDetails } from '../../database/entities/provider_bank_details.entity';
import { ProviderCertification } from '../../database/entities/provider_certification.entity';
import { SeekerFavouriteProvider } from '../../database/entities/seeker_favourite_provider.entity';
import { ProviderPerformanceStats } from '../../database/entities/provider_performance_stats.entity';
import { ProviderVerificationStep } from '../../database/entities/provider_verification_steps.entity';
import { ProviderVerificationCase } from '../../database/entities/provider_verification_cases.entity';
import { VerificationStatus } from '../../database/common/enum';
import { DomainEventEmitter } from '../../events/domain-event-emitter.service';
import { TransactionHelper } from '../../database/transaction.helper';
import { StripeService } from '../stripe/stripe.service';
import { AppCacheService } from '../../cache/cache.service';
import { EsendexService } from '../sms/esendex.service';
import { createMockRepository, createMockEventEmitter, createMockTransactionHelper, createMockStripeService } from '../../../test/helpers/test-factory';

function createMockCacheService() {
  return {
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue(undefined),
    del: jest.fn().mockResolvedValue(undefined),
    delByPrefix: jest.fn().mockResolvedValue(undefined),
  };
}

function createMockEsendexService() {
  return { sendSms: jest.fn().mockResolvedValue(undefined) };
}

describe('ProfileService', () => {
  let module: TestingModule;
  let service: ProfileService;
  let cacheService!: ReturnType<typeof createMockCacheService>;
  let esendexService!: ReturnType<typeof createMockEsendexService>;
  let profileRepo: ReturnType<typeof createMockRepository>;
  let bankDetailsRepo: ReturnType<typeof createMockRepository>;
  let workInfoRepo: ReturnType<typeof createMockRepository>;
  let professionalDetailsRepo: ReturnType<typeof createMockRepository>;
  let categoryRepo: ReturnType<typeof createMockRepository> & { createQueryBuilder: jest.Mock };
  let skillRepo: ReturnType<typeof createMockRepository> & { createQueryBuilder: jest.Mock };
  let employeeRepo: ReturnType<typeof createMockRepository> & { createQueryBuilder: jest.Mock };
  let certificationRepo: ReturnType<typeof createMockRepository> & { createQueryBuilder: jest.Mock };
  let verificationCaseRepo: ReturnType<typeof createMockRepository>;
  let stripeService: ReturnType<typeof createMockStripeService>;

  beforeEach(async () => {
    profileRepo = createMockRepository();
    bankDetailsRepo = createMockRepository();
    workInfoRepo = createMockRepository();
    professionalDetailsRepo = createMockRepository();
    categoryRepo = { ...createMockRepository(), createQueryBuilder: jest.fn() };
    skillRepo = { ...createMockRepository(), createQueryBuilder: jest.fn() };
    employeeRepo = { ...createMockRepository(), createQueryBuilder: jest.fn() };
    certificationRepo = { ...createMockRepository(), createQueryBuilder: jest.fn() };
    verificationCaseRepo = createMockRepository();
    stripeService = createMockStripeService();
    cacheService = createMockCacheService();
    esendexService = createMockEsendexService();

    module = await Test.createTestingModule({
      providers: [
        ProfileService,
        { provide: getRepositoryToken(Profile), useValue: profileRepo },
        { provide: getRepositoryToken(ProviderProfessionalDetails), useValue: professionalDetailsRepo },
        { provide: getRepositoryToken(ProviderWorkInfo), useValue: workInfoRepo },
        { provide: getRepositoryToken(ProviderCategory), useValue: categoryRepo },
        { provide: getRepositoryToken(ProviderSkill), useValue: skillRepo },
        { provide: getRepositoryToken(ProviderMedia), useValue: createMockRepository() },
        { provide: getRepositoryToken(ProviderEmployee), useValue: employeeRepo },
        { provide: getRepositoryToken(ProviderBankDetails), useValue: bankDetailsRepo },
        { provide: getRepositoryToken(ProviderCertification), useValue: certificationRepo },
        { provide: getRepositoryToken(SeekerFavouriteProvider), useValue: createMockRepository() },
        { provide: getRepositoryToken(ProviderVerificationStep), useValue: createMockRepository() },
        { provide: getRepositoryToken(ProviderVerificationCase), useValue: verificationCaseRepo },
        { provide: DomainEventEmitter, useValue: createMockEventEmitter() },
        { provide: TransactionHelper, useValue: createMockTransactionHelper() },
        { provide: StripeService, useValue: stripeService },
        { provide: AppCacheService, useValue: cacheService },
        { provide: EsendexService, useValue: esendexService },
      ],
    }).compile();

    service = module.get<ProfileService>(ProfileService);
  });

  afterEach(() => module.close());

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendPhoneOtp', () => {
    const USER = 'user-1';

    beforeEach(() => {
      profileRepo.findOne.mockResolvedValue({ id: 'p-1', phone: '0412345678' } as any);
      cacheService.get.mockResolvedValue(null);
    });

    const cooldownCall = () =>
      cacheService.set.mock.calls.find((c: any[]) => String(c[0]).startsWith('phone_otp_cooldown:'));
    const otpCall = () =>
      cacheService.set.mock.calls.find((c: any[]) => /^phone_otp:/.test(String(c[0])));

    it('should send an OTP and set both cache keys', async () => {
      const result = await service.sendPhoneOtp(USER);

      expect(esendexService.sendSms).toHaveBeenCalledTimes(1);
      expect(otpCall()?.[2]).toBe(300);
      expect(cooldownCall()?.[2]).toBe(60);
      expect(result).toEqual({ message: 'OTP sent to your phone number' });
    });

    it('should set the cooldown BEFORE sending, so a failed send still throttles', async () => {
      // Regression: the cooldown used to be set after the send, so a provider outage left no
      // cooldown at all and the caller could retry without limit, sending an SMS each time.
      esendexService.sendSms.mockRejectedValue(new Error('spawn curl ENOENT'));

      await expect(service.sendPhoneOtp(USER)).rejects.toThrow();

      expect(cooldownCall()).toBeDefined();
      expect(cooldownCall()?.[2]).toBe(60);
    });

    it('should reject a second request while the cooldown is live', async () => {
      cacheService.get.mockResolvedValue(true);

      await expect(service.sendPhoneOtp(USER)).rejects.toThrow(
        'Please wait 60 seconds before requesting another OTP',
      );
      expect(esendexService.sendSms).not.toHaveBeenCalled();
    });

    it('should reject when the profile has no phone number', async () => {
      profileRepo.findOne.mockResolvedValue({ id: 'p-1', phone: null } as any);

      await expect(service.sendPhoneOtp(USER)).rejects.toThrow('No phone number on file');
      expect(esendexService.sendSms).not.toHaveBeenCalled();
    });

    it('should send a 6-digit code and never cache it in plaintext', async () => {
      await service.sendPhoneOtp(USER);

      const text: string = esendexService.sendSms.mock.calls[0][1];
      const code = text.match(/\b(\d{6})\b/)?.[1];
      expect(code).toBeDefined();

      // Only the HMAC goes to cache — the code itself must never be stored.
      const cached = otpCall()?.[1];
      expect(cached).toEqual({ hash: expect.any(String) });
      expect(JSON.stringify(cached)).not.toContain(code!);
    });

    it('should normalise the recipient through to the SMS provider', async () => {
      await service.sendPhoneOtp(USER);
      expect(esendexService.sendSms).toHaveBeenCalledWith('0412345678', expect.any(String));
    });

    it('should generate codes that are unpredictable across calls', async () => {
      // crypto.randomInt, not Math.random: V8's PRNG is seeded and its output sequence can be
      // recovered from observed values, which is not acceptable for an auth code.
      const codes = new Set<string>();
      for (let i = 0; i < 25; i++) {
        cacheService.set.mockClear();
        esendexService.sendSms.mockClear();
        await service.sendPhoneOtp(USER);
        const text: string = esendexService.sendSms.mock.calls[0][1];
        codes.add(text.match(/\b(\d{6})\b/)![1]!);
      }
      expect(codes.size).toBeGreaterThan(20);
    });
  });

  it('should throw NotFoundException when profile is missing', async () => {
    profileRepo.findOne.mockResolvedValue(null);

    await expect(service.findOne('missing-user')).rejects.toThrow(NotFoundException);
  });

  it('should throw ConflictException when creating an existing profile', async () => {
    profileRepo.findOne.mockResolvedValue({ id: 'existing-profile' });

    await expect(
      service.create('user-1', { firstName: 'John', lastName: 'Doe', phone: '0400000000' } as any),
    ).rejects.toThrow(ConflictException);
  });

  // ── patchBankDetails ───────────────────────────────────────────────────────

  describe('patchBankDetails', () => {
    const PROFILE_ID = 'profile-1';
    const USER_ID = 'user-1';

    beforeEach(() => {
      profileRepo.findOne.mockResolvedValue({ id: PROFILE_ID });
    });

    it('should update bsbNumber on existing record', async () => {
      const existing = { profileId: PROFILE_ID, bankName: 'ANZ', accountNumber: '123', bsbNumber: null, accountHolderName: 'John' };
      bankDetailsRepo.findOne.mockResolvedValue(existing);
      bankDetailsRepo.save.mockResolvedValue({ ...existing, bsbNumber: '062-000' });

      const result = await service.patchBankDetails(USER_ID, { bsbNumber: '062-000' } as any);

      expect(bankDetailsRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ bsbNumber: '062-000' }),
      );
      expect(result.bsbNumber).toBe('062-000');
    });

    it('should create new record when none exists', async () => {
      bankDetailsRepo.findOne.mockResolvedValue(null);
      bankDetailsRepo.create.mockReturnValue({ profileId: PROFILE_ID });
      bankDetailsRepo.save.mockResolvedValue({ profileId: PROFILE_ID, bankName: 'CBA', accountNumber: '999', bsbNumber: '063-000', accountHolderName: 'Jane' });

      const result = await service.patchBankDetails(USER_ID, {
        bankName: 'CBA',
        accountNumber: '999',
        bsbNumber: '063-000',
        accountHolderName: 'Jane',
      } as any);

      expect(bankDetailsRepo.create).toHaveBeenCalledWith({ profileId: PROFILE_ID });
      expect(result.bsbNumber).toBe('063-000');
    });
  });

  // ── getCompleteness ────────────────────────────────────────────────────────

  describe('getCompleteness', () => {
    const USER_ID = 'user-1';
    const PROFILE_ID = 'profile-1';

    const fullProfile = {
      id: PROFILE_ID,
      firstName: 'John',
      lastName: 'Doe',
      phone: '0400000000',
      date_of_birth: new Date('1990-01-01'),
      streetAddress: '123 Main St',
      suburb: 'Surry Hills',
      state: 'NSW',
      postcode: '2000',
    };

    const mockQbWith = (count: number) => {
      const qb = { where: jest.fn().mockReturnThis(), getCount: jest.fn().mockResolvedValue(count) };
      return qb;
    };

    describe('SEEKER', () => {
      it('should return incomplete profile when profile does not exist', async () => {
        profileRepo.findOne.mockResolvedValue(null);

        const result = await service.getCompleteness(USER_ID, false);

        expect(result.completed).toBe(false);
        expect(result.profile).toBe('incomplete');
        expect(result.phoneVerified).toBe(false);
      });

      it('should mark completed when all required fields are filled and phone is verified', async () => {
        profileRepo.findOne.mockResolvedValue({ ...fullProfile, phoneVerified: true });

        const result = await service.getCompleteness(USER_ID, false);

        expect(result.profile).toBe('completed');
        expect(result.phoneVerified).toBe(true);
        expect(result.completed).toBe(true);
      });

      it('should not mark completed when the profile is filled but phone is unverified', async () => {
        profileRepo.findOne.mockResolvedValue({ ...fullProfile, phoneVerified: false });

        const result = await service.getCompleteness(USER_ID, false);

        expect(result.profile).toBe('completed');
        expect(result.completed).toBe(false);
      });

      it('should mark incomplete when some fields are missing', async () => {
        profileRepo.findOne.mockResolvedValue({
          id: PROFILE_ID,
          firstName: 'John',
          lastName: 'Doe',
          phone: null,
          date_of_birth: null,
          streetAddress: null,
          suburb: null,
          state: null,
          postcode: null,
        });

        const result = await service.getCompleteness(USER_ID, false);

        expect(result.profile).toBe('incomplete');
        expect(result.completed).toBe(false);
      });

      it('should not include provider fields', async () => {
        profileRepo.findOne.mockResolvedValue(fullProfile);

        const result = await service.getCompleteness(USER_ID, false);

        expect(result.workInfo).toBeUndefined();
        expect(result.professionalDetails).toBeUndefined();
        expect(result.bankDetail).toBeUndefined();
      });
    });

    describe('PROVIDER', () => {
      const fullWorkInfo = { businessName: 'ACME Pty Ltd', abn: '12345678901' };
      const fullDetails = {
        ratePerHourWeekday: 50,
        ratePerHourWeekend: 75,
        ratePerHourHoliday: 100,
        subscriptionRate1Month: 500,
        subscriptionRate3Months: 1400,
        subscriptionRate6Months: 2500,
      };
      const fullBankDetails = { bankName: 'ANZ', accountNumber: '123456789', accountHolderName: 'John Doe' };

      beforeEach(() => {
        stripeService.getOnboardingStatus.mockResolvedValue({
          onboarded: false, state: 'not_started', chargesEnabled: false, payoutsEnabled: false,
          requirementsDue: [], disabledReason: null, onboardingCompletedAt: null,
          requirementsSyncedAt: null, email: null,
        });
      });

      it('should mark all provider sections incomplete when profile does not exist', async () => {
        profileRepo.findOne.mockResolvedValue(null);
        categoryRepo.createQueryBuilder.mockReturnValue(mockQbWith(0));
        skillRepo.createQueryBuilder.mockReturnValue(mockQbWith(0));
        employeeRepo.createQueryBuilder.mockReturnValue(mockQbWith(0));
        certificationRepo.createQueryBuilder.mockReturnValue(mockQbWith(0));
        verificationCaseRepo.findOne.mockResolvedValue(null);

        const result = await service.getCompleteness(USER_ID, true);

        expect(result.completed).toBe(false);
        expect(result.profile).toBe('incomplete');
        expect(result.workInfo).toBe('incomplete');
        expect(result.professionalDetails).toBe('incomplete');
        expect(result.employees).toBe('incomplete');
        expect(result.verification).toBe('incomplete');
        expect(result.certification).toBe('incomplete');
        expect(result.stripeAccount).toBe('incomplete');
        expect(result.bankDetail).toBe('incomplete');
      });

      it('should mark completed when all sections are complete', async () => {
        profileRepo.findOne.mockResolvedValue({ ...fullProfile, phoneVerified: true });
        workInfoRepo.findOne.mockResolvedValue(fullWorkInfo);
        professionalDetailsRepo.findOne.mockResolvedValue(fullDetails);
        bankDetailsRepo.findOne.mockResolvedValue(fullBankDetails);
        categoryRepo.createQueryBuilder.mockReturnValue(mockQbWith(2));
        skillRepo.createQueryBuilder.mockReturnValue(mockQbWith(3));
        employeeRepo.createQueryBuilder.mockReturnValue(mockQbWith(1));
        certificationRepo.createQueryBuilder.mockReturnValue(mockQbWith(1));
        verificationCaseRepo.findOne.mockResolvedValue({ status: VerificationStatus.APPROVED });
        stripeService.getOnboardingStatus.mockResolvedValue({
          onboarded: true, state: 'enabled', chargesEnabled: true, payoutsEnabled: true,
          requirementsDue: [], disabledReason: null, onboardingCompletedAt: new Date('2026-01-01'),
          requirementsSyncedAt: new Date('2026-01-01'), email: 'provider@test.com',
        });

        const result = await service.getCompleteness(USER_ID, true);

        expect(result.completed).toBe(true);
        expect(result.workInfo).toBe('completed');
        expect(result.professionalDetails).toBe('completed');
        expect(result.employees).toBe('completed');
        expect(result.verification).toBe('completed');
        expect(result.certification).toBe('completed');
        expect(result.stripeAccount).toBe('completed');
        expect(result.bankDetail).toBe('completed');
      });

      it('should mark professionalDetails incomplete when no categories or skills exist', async () => {
        profileRepo.findOne.mockResolvedValue(fullProfile);
        workInfoRepo.findOne.mockResolvedValue(fullWorkInfo);
        professionalDetailsRepo.findOne.mockResolvedValue(fullDetails);
        bankDetailsRepo.findOne.mockResolvedValue(fullBankDetails);
        categoryRepo.createQueryBuilder.mockReturnValue(mockQbWith(0));
        skillRepo.createQueryBuilder.mockReturnValue(mockQbWith(0));
        employeeRepo.createQueryBuilder.mockReturnValue(mockQbWith(0));
        certificationRepo.createQueryBuilder.mockReturnValue(mockQbWith(0));
        verificationCaseRepo.findOne.mockResolvedValue(null);

        const result = await service.getCompleteness(USER_ID, true);

        expect(result.professionalDetails).toBe('incomplete');
        expect(result.completed).toBe(false);
      });

      it('should mark sections incomplete when their records do not exist', async () => {
        profileRepo.findOne.mockResolvedValue(fullProfile);
        workInfoRepo.findOne.mockResolvedValue(null);
        professionalDetailsRepo.findOne.mockResolvedValue(null);
        bankDetailsRepo.findOne.mockResolvedValue(null);
        categoryRepo.createQueryBuilder.mockReturnValue(mockQbWith(0));
        skillRepo.createQueryBuilder.mockReturnValue(mockQbWith(0));
        employeeRepo.createQueryBuilder.mockReturnValue(mockQbWith(0));
        certificationRepo.createQueryBuilder.mockReturnValue(mockQbWith(0));
        verificationCaseRepo.findOne.mockResolvedValue(null);

        const result = await service.getCompleteness(USER_ID, true);

        expect(result.workInfo).toBe('incomplete');
        expect(result.bankDetail).toBe('incomplete');
        expect(result.professionalDetails).toBe('incomplete');
      });

      it('should mark professionalDetails complete on category + skill alone, regardless of rates', async () => {
        profileRepo.findOne.mockResolvedValue(fullProfile);
        workInfoRepo.findOne.mockResolvedValue(fullWorkInfo);
        professionalDetailsRepo.findOne.mockResolvedValue(null); // no rates set at all
        bankDetailsRepo.findOne.mockResolvedValue(fullBankDetails);
        categoryRepo.createQueryBuilder.mockReturnValue(mockQbWith(1));
        skillRepo.createQueryBuilder.mockReturnValue(mockQbWith(1));
        employeeRepo.createQueryBuilder.mockReturnValue(mockQbWith(0));
        certificationRepo.createQueryBuilder.mockReturnValue(mockQbWith(0));
        verificationCaseRepo.findOne.mockResolvedValue(null);

        const result = await service.getCompleteness(USER_ID, true);

        // Rates no longer gate completeness — one category + one skill is enough.
        expect(result.professionalDetails).toBe('completed');
      });
    });
  });

  // ── queryProviders (findProviders / findFavouriteProviders) ──────────────

  describe('findProviders / findFavouriteProviders — search filter', () => {
    const SEEKER_ID = 'seeker-1';

    const makeQb = (rawOne: any, rawMany: any[]) => {
      const qb: any = {
        innerJoin: jest.fn().mockReturnThis(),
        leftJoin: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        addGroupBy: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        offset: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        setParameter: jest.fn().mockReturnThis(),
        subQuery: jest.fn().mockReturnThis(),
        from: jest.fn().mockReturnThis(),
        getQuery: jest.fn().mockReturnValue('EXISTS (SELECT 1)'),
        getRawOne: jest.fn().mockResolvedValue(rawOne),
        getRawMany: jest.fn().mockResolvedValue(rawMany),
      };
      return qb;
    };

    const baseQuery = (extra: object = {}) =>
      ({ page: 1, limit: 10, sortBy: 'newest' as any, order: 'DESC' as const, ...extra } as any);

    it('should apply ILIKE search on businessName when search param is provided', async () => {
      const qb = makeQb({ cnt: '1' }, [
        {
          id: 'profile-1',
          name: 'Plumbing Co',
          avatarUrl: null,
          state: 'NSW',
          ratePerHourWeekday: 80,
          skills: [],
          avgRating: '4.5',
          categories: ['Plumbing'],
          jobSuccessRate: '100.0',
          isFavourite: false,
        },
      ]);

      (profileRepo as any).createQueryBuilder = jest.fn().mockReturnValue(qb);

      const result = await service.findProviders(SEEKER_ID, baseQuery({ search: 'plumb' }));

      expect(result.total).toBe(1);
      const andWhereCalls: string[] = qb.andWhere.mock.calls.map((c: any[]) => c[0]);
      expect(andWhereCalls).toContain('workInfo.businessName ILIKE :search');
    });

    it('should NOT apply search filter when search param is absent', async () => {
      const qb = makeQb({ cnt: '0' }, []);
      (profileRepo as any).createQueryBuilder = jest.fn().mockReturnValue(qb);

      await service.findProviders(SEEKER_ID, baseQuery());

      const andWhereCalls: string[] = qb.andWhere.mock.calls.map((c: any[]) => c[0]);
      expect(andWhereCalls).not.toContain('workInfo.businessName ILIKE :search');
    });

    // ── Cached stats / join fan-out regression ───────────────────────────────
    //
    // jobSuccessRate was aggregated inline over a result set that also carried the category and
    // skill joins, so each job counted once per (category x skill) and the rate came back
    // multiplied by that — 964.3% for a true 96.4%. It now comes from the cached row, which a
    // PK join cannot inflate.
    it('should read jobSuccessRate from the cached stats row, not aggregate it inline', async () => {
      const qb = makeQb({ cnt: '0' }, []);
      (profileRepo as any).createQueryBuilder = jest.fn().mockReturnValue(qb);

      await service.findProviders(SEEKER_ID, baseQuery());

      const sql: string = qb.addSelect.mock.calls.find((c: any[]) => c[1] === 'jobSuccessRate')?.[0];
      expect(sql).toBe('MAX(pps.job_success_rate)');
    });

    it('should join the cached stats table and not selections/jobs', async () => {
      const qb = makeQb({ cnt: '0' }, []);
      (profileRepo as any).createQueryBuilder = jest.fn().mockReturnValue(qb);

      await service.findProviders(SEEKER_ID, baseQuery());

      // Must be the entity class, not a string. A dotted string like
      // 'service.provider_performance_stats' is parsed by TypeORM as alias.relation, not
      // schema.table, and blows up at runtime with "service alias was not found".
      const joins = qb.leftJoin.mock.calls.map((c: any[]) => c[0]);
      expect(joins).toContain(ProviderPerformanceStats);
      // Nothing job-shaped should be joined here any more — that was the fan-out source.
      const aliases: string[] = qb.leftJoin.mock.calls.map((c: any[]) => String(c[1]));
      expect(aliases).not.toContain('sel');
      expect(aliases).not.toContain('j');
    });

    it('should apply search filter in findFavouriteProviders', async () => {
      const qb = makeQb({ cnt: '1' }, [
        {
          id: 'profile-2',
          name: 'Electro Fix',
          avatarUrl: null,
          state: 'VIC',
          ratePerHourWeekday: 90,
          skills: [],
          avgRating: '5.0',
          categories: ['Electrical'],
          jobSuccessRate: null,
          isFavourite: true,
        },
      ]);

      (profileRepo as any).createQueryBuilder = jest.fn().mockReturnValue(qb);

      const result = await service.findFavouriteProviders(SEEKER_ID, baseQuery({ search: 'electro' }));

      expect(result.total).toBe(1);
      const andWhereCalls: string[] = qb.andWhere.mock.calls.map((c: any[]) => c[0]);
      expect(andWhereCalls).toContain('workInfo.businessName ILIKE :search');
    });
  });

  // ── findProviderById aggregates ─────────────────────────────────────────────

  describe('findProviderById — rate aggregates', () => {
    const SEEKER_ID = 'seeker-1';
    const PROFILE_ID = 'profile-1';

    /**
     * The detail query cross-joins categories, reviews AND selections/jobs off one profile, so
     * every job row repeats per (category x review) and every review row per (category x job).
     * All four ratios must therefore count distinct ids; SUM counts the repeats and inflates
     * each ratio by the size of the other joins.
     */
    const makeDetailQb = (raw: any) => ({
      innerJoin: jest.fn().mockReturnThis(),
      leftJoin: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      addGroupBy: jest.fn().mockReturnThis(),
      setParameter: jest.fn().mockReturnThis(),
      subQuery: jest.fn().mockReturnThis(),
      from: jest.fn().mockReturnThis(),
      getQuery: jest.fn().mockReturnValue('EXISTS (SELECT 1)'),
      getRawOne: jest.fn().mockResolvedValue(raw),
    });

    const rawDetail = {
      id: PROFILE_ID,
      businessName: 'Test Company Name',
      avatarUrl: null,
      country: 'Australia',
      phone: '0400000000',
      email: 'p@example.com',
      bio: null,
      categories: ['Carpentry'],
      skills: ['Framing', 'Decking'],
      ratePerHourWeekday: 12,
      ratePerHourWeekend: 12,
      ratePerHourHoliday: 12,
      subscriptionRate1Month: 0,
      subscriptionRate3Months: 0,
      subscriptionRate6Months: 0,
      avgRating: '3.7',
      jobsDone: '27',
      rehired: '0',
      jobSuccessRate: '96.4',
      recommendationRate: '90.0',
      onTimeRate: '80.0',
      onBudgetRate: '70.0',
      isVerified: true,
      isCertified: false,
      isFavourite: true,
    };

    const runDetail = async () => {
      const qb = makeDetailQb(rawDetail);
      (profileRepo as any).createQueryBuilder = jest.fn().mockReturnValue(qb);
      profileRepo.findOne.mockResolvedValue({
        id: PROFILE_ID, firstName: 'A', lastName: 'B', avatarUrl: null,
      } as any);
      employeeRepo.find.mockResolvedValue([]);
      await service.findProviderById(SEEKER_ID, PROFILE_ID);
      return qb;
    };

    const sqlFor = (qb: any, alias: string): string =>
      qb.addSelect.mock.calls.find((c: any[]) => c[1] === alias)?.[0];

    it.each([
      ['jobSuccessRate', 'MAX(pps.job_success_rate)'],
      ['recommendationRate', 'MAX(pps.recommendation_rate)'],
      ['onTimeRate', 'MAX(pps.on_time_rate)'],
      ['onBudgetRate', 'MAX(pps.on_budget_rate)'],
      ['jobsDone', 'MAX(pps.jobs_done)'],
      ['rehired', 'MAX(pps.rehired)'],
    ])('%s should be read from the cached stats row', async (alias, expected) => {
      const qb = await runDetail();
      expect(sqlFor(qb, alias)).toBe(expected);
    });

    it('should join the cached stats table and no longer join reviews/selections/jobs', async () => {
      // Those three joins existed only to feed the rate aggregates, and their cross product is
      // what inflated every rate here: jobs multiplied reviews and reviews multiplied jobs.
      const qb = await runDetail();

      const targets = qb.leftJoin.mock.calls.map((c: any[]) => c[0]);
      expect(targets).toContain(ProviderPerformanceStats);

      
      const aliases: string[] = qb.leftJoin.mock.calls.map((c: any[]) => String(c[1]));
      expect(aliases).not.toContain('review');
      expect(aliases).not.toContain('sel');
      expect(aliases).not.toContain('j');
    });

    it('should surface the cached values on the response', async () => {
      const qb = makeDetailQb(rawDetail);
      (profileRepo as any).createQueryBuilder = jest.fn().mockReturnValue(qb);
      profileRepo.findOne.mockResolvedValue({
        id: PROFILE_ID, firstName: 'A', lastName: 'B', avatarUrl: null,
      } as any);
      employeeRepo.find.mockResolvedValue([]);

      const result = await service.findProviderById(SEEKER_ID, PROFILE_ID);

      expect(result.jobSuccessRate).toBe(96.4);
      expect(result.recommendationRate).toBe(90);
      expect(result.jobsDone).toBe(27);
      expect(result.categories).toEqual(['Carpentry']);
      expect(result.skills).toEqual(['Framing', 'Decking']);
      // isVerified reflects the approved verification case; isCertified is the separate cert check.
      expect(result.isVerified).toBe(true);
      expect(result.isCertified).toBe(false);
    });

    it('should default skills to an empty array when the provider has none', async () => {
      const qb = makeDetailQb({ ...rawDetail, skills: null });
      (profileRepo as any).createQueryBuilder = jest.fn().mockReturnValue(qb);
      profileRepo.findOne.mockResolvedValue({
        id: PROFILE_ID, firstName: 'A', lastName: 'B', avatarUrl: null,
      } as any);
      employeeRepo.find.mockResolvedValue([]);

      const result = await service.findProviderById(SEEKER_ID, PROFILE_ID);

      expect(result.skills).toEqual([]);
    });

    it('should map absent stats to null rather than 0', async () => {
      // A provider with no terminal jobs and no reviews has no cached row; null means
      // "nothing to measure yet", which is not the same as 0%.
      const qb = makeDetailQb({
        ...rawDetail,
        jobsDone: null, rehired: null,
        jobSuccessRate: null, recommendationRate: null, onTimeRate: null, onBudgetRate: null,
      });
      (profileRepo as any).createQueryBuilder = jest.fn().mockReturnValue(qb);
      profileRepo.findOne.mockResolvedValue({
        id: PROFILE_ID, firstName: 'A', lastName: 'B', avatarUrl: null,
      } as any);
      employeeRepo.find.mockResolvedValue([]);

      const result = await service.findProviderById(SEEKER_ID, PROFILE_ID);

      expect(result.jobSuccessRate).toBeNull();
      expect(result.recommendationRate).toBeNull();
      expect(result.onTimeRate).toBeNull();
      expect(result.onBudgetRate).toBeNull();
    });
  });

  describe('update name lock', () => {
    const locked = () => ({
      id: 'p-1', firstName: 'Saif', lastName: 'Bashar', date_of_birth: '1988-04-23', nameLocked: true,
    } as any);

    beforeEach(() => {
      profileRepo.save.mockImplementation(async (r: any) => r);
    });

    it('rejects a name change once identity is locked', async () => {
      profileRepo.findOne.mockResolvedValue(locked());

      await expect(service.update('user-1', { firstName: 'Qirat' } as any)).rejects.toThrow(
        'name and date of birth are locked',
      );
      expect(profileRepo.save).not.toHaveBeenCalled();
    });

    it('rejects a date-of-birth change once identity is locked', async () => {
      profileRepo.findOne.mockResolvedValue(locked());

      await expect(service.update('user-1', { dateOfBirth: '1990-01-01' } as any)).rejects.toThrow(
        'name and date of birth are locked',
      );
      expect(profileRepo.save).not.toHaveBeenCalled();
    });

    it('allows a no-op date of birth (same value) while locked', async () => {
      profileRepo.findOne.mockResolvedValue(locked());

      await expect(service.update('user-1', { dateOfBirth: '1988-04-23' } as any)).resolves.toBeDefined();
      expect(profileRepo.save).toHaveBeenCalled();
    });

    it('allows non-name edits while the name is locked', async () => {
      profileRepo.findOne.mockResolvedValue(locked());

      await expect(service.update('user-1', { phone: '+61411643974' } as any)).resolves.toBeDefined();
      expect(profileRepo.save).toHaveBeenCalled();
    });

    it('allows a no-op name (same value) while locked', async () => {
      profileRepo.findOne.mockResolvedValue(locked());

      await expect(service.update('user-1', { firstName: 'Saif' } as any)).resolves.toBeDefined();
      expect(profileRepo.save).toHaveBeenCalled();
    });

    it('allows a name change when the name is not locked', async () => {
      profileRepo.findOne.mockResolvedValue({ ...locked(), nameLocked: false });

      await expect(service.update('user-1', { firstName: 'Qirat' } as any)).resolves.toBeDefined();
      expect(profileRepo.save).toHaveBeenCalled();
    });
  });
});
