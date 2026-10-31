import * as crypto from 'crypto';
import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';

const AU_STATE_MAP: Record<string, string> = {
  'australian capital territory': 'ACT', 'act': 'ACT',
  'new south wales': 'NSW', 'nsw': 'NSW',
  'northern territory': 'NT', 'nt': 'NT',
  'queensland': 'QLD', 'qld': 'QLD',
  'south australia': 'SA', 'sa': 'SA',
  'tasmania': 'TAS', 'tas': 'TAS',
  'victoria': 'VIC', 'vic': 'VIC',
  'western australia': 'WA', 'wa': 'WA',
};

function normaliseAuState(state: string): string {
  return AU_STATE_MAP[state.trim().toLowerCase()] ?? state;
}
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateProfessionalDetailsDto } from './dto/update-professional-details.dto';
import { PatchProfessionalDetailsDto } from './dto/patch-professional-details.dto';
import { UpdateWorkInfoDto } from './dto/update-work-info.dto';
import { PatchWorkInfoDto } from './dto/patch-work-info.dto';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { PatchEmployeeDto } from './dto/patch-employee.dto';
import { CreateBankDetailsDto } from './dto/create-bank-details.dto';
import { PatchBankDetailsDto } from './dto/patch-bank-details.dto';
import { CreateCertificationDto } from './dto/create-certification.dto';
import { PatchCertificationDto } from './dto/patch-certification.dto';
import { CertificationStatus, UserRole, VerificationStatus, VerificationStepType } from '../../database/common/enum';
import { ProviderVerificationStep } from '../../database/entities/provider_verification_steps.entity';
import { ProviderVerificationCase } from '../../database/entities/provider_verification_cases.entity';
import { ProfileStatusDto } from './dto/profile-completeness.dto';
import { ProvidersQueryDto, ProviderSortBy } from './dto/providers-query.dto';
import { PaginatedResponseDto } from '../../interfaces/paginated-response.dto';
import { IdResponseDto } from '../../interfaces';
import { ProviderListItemDto, PublicProviderListItemDto } from './dto/provider-list-item.dto';
import { ProviderDetailDto, ProviderDetailEmployeeDto } from './dto/provider-detail.dto';
import { DomainEventEmitter } from '../../events/domain-event-emitter.service';
import { ProfileCreatedEvent } from './events/profile-created.event';
import { CertificationSubmittedEvent } from './events/certification-submitted.event';
import { TransactionHelper } from '../../database';
import { StripeService } from '../stripe/stripe.service';
import { IndividualOnboardingData } from '../stripe/interfaces/stripe-process.interface';
import { StripeOnboardingStatus } from '../stripe/interfaces/onboarding-status.interface';
import { AppCacheService } from '../../cache/cache.service';
import { EsendexService } from '../sms/esendex.service';

@Injectable()
export class ProfileService {
  constructor(
    @InjectRepository(Profile)
    private readonly profileRepository: Repository<Profile>,
    @InjectRepository(ProviderProfessionalDetails)
    private readonly professionalDetailsRepository: Repository<ProviderProfessionalDetails>,
    @InjectRepository(ProviderWorkInfo)
    private readonly workInfoRepository: Repository<ProviderWorkInfo>,
    @InjectRepository(ProviderCategory)
    private readonly providerCategoryRepository: Repository<ProviderCategory>,
    @InjectRepository(ProviderSkill)
    private readonly providerSkillRepository: Repository<ProviderSkill>,
    @InjectRepository(ProviderMedia)
    private readonly providerMediaRepository: Repository<ProviderMedia>,
    @InjectRepository(ProviderEmployee)
    private readonly providerEmployeeRepository: Repository<ProviderEmployee>,
    @InjectRepository(ProviderBankDetails)
    private readonly bankDetailsRepository: Repository<ProviderBankDetails>,
    @InjectRepository(ProviderCertification)
    private readonly certificationRepository: Repository<ProviderCertification>,
    @InjectRepository(SeekerFavouriteProvider)
    private readonly favouriteRepository: Repository<SeekerFavouriteProvider>,
    @InjectRepository(ProviderVerificationStep)
    private readonly verificationStepRepository: Repository<ProviderVerificationStep>,
    @InjectRepository(ProviderVerificationCase)
    private readonly verificationCaseRepository: Repository<ProviderVerificationCase>,
    private readonly eventEmitter: DomainEventEmitter,

    private readonly txHelper: TransactionHelper,
    private readonly stripeService: StripeService,
    private readonly cacheService: AppCacheService,
    private readonly esendexService: EsendexService,
  ) {}

  // ─── Basic Profile ──────────────────────────────────────────────────────────

  async findOne(userId: string): Promise<Profile> {
    const record = await this.profileRepository.findOne({
      where: { user: { id: userId } as any },
    });
    if (!record) throw new NotFoundException('Profile not found. Please complete your profile setup to continue.');
    return record;
  }

  async create(userId: string, dto: CreateProfileDto): Promise<Profile> {
    const existing = await this.profileRepository.findOne({ where: { user: { id: userId } as any } });
    if (existing) throw new ConflictException('Profile already exists for this user');

    const { firstName, lastName, phone, avatarUrl, dateOfBirth, streetAddress, suburb, state, postcode, country } = dto;

    const record = this.profileRepository.create({
      user: { id: userId } as any,
      firstName,
      lastName,
      phone,
      avatarUrl,
      date_of_birth: dateOfBirth ? new Date(dateOfBirth) : undefined,
      streetAddress,
      suburb,
      state,
      postcode,
      country,
    });
    await this.profileRepository.save(record);

    this.eventEmitter.emit(new ProfileCreatedEvent(record.id, `${firstName} ${lastName}`, userId));
    return record;
  }

  async update(userId: string, dto: UpdateProfileDto): Promise<Profile> {
    const record = await this.findOne(userId);

    const { firstName, lastName, phone, avatarUrl, dateOfBirth, streetAddress, suburb, state, postcode, country } = dto;

    // Once identity is admin-approved, the name and date of birth are KYC-verified against the ID
    // document and Stripe, so they must not change — otherwise the details sent to Stripe drift from
    // the document and the connected account gets restricted. A rejected/unreviewed provider can
    // still edit them. (Same `nameLocked` flag covers both keyed identity fields.)
    const toDateStr = (d: unknown): string | null => {
      if (d == null) return null;
      const dt = d instanceof Date ? d : new Date(d as string);
      return isNaN(dt.getTime()) ? null : dt.toISOString().slice(0, 10);
    };
    const changingName =
      (firstName !== undefined && firstName !== record.firstName) ||
      (lastName !== undefined && lastName !== record.lastName);
    const changingDob =
      dateOfBirth !== undefined && toDateStr(dateOfBirth) !== toDateStr(record.date_of_birth);
    if (record.nameLocked && (changingName || changingDob)) {
      throw new ForbiddenException({
        message: 'Your name and date of birth are locked because your identity has been verified. Contact support if they need to be corrected.',
        errorCode: 'IDENTITY_DETAILS_LOCKED',
      });
    }

    if (firstName !== undefined) record.firstName = firstName;
    if (lastName !== undefined) record.lastName = lastName;
    if (phone !== undefined) { record.phone = phone; record.phoneVerified = false; }
    if (avatarUrl !== undefined) record.avatarUrl = avatarUrl;
    if (dateOfBirth !== undefined) record.date_of_birth = new Date(dateOfBirth);
    if (streetAddress !== undefined) record.streetAddress = streetAddress;
    if (suburb !== undefined) record.suburb = suburb;
    if (state !== undefined) record.state = state;
    if (postcode !== undefined) record.postcode = postcode;
    if (country !== undefined) record.country = country;

    return this.profileRepository.save(record);
  }

  // ─── Professional Details ────────────────────────────────────────────────────

  async getProfessionalDetails(userId: string): Promise<ProviderProfessionalDetails> {
    const profile = await this.findOne(userId);
    const details = await this.professionalDetailsRepository.findOne({
      where: { profileId: profile.id },
      relations: ['categoryLinks', 'categoryLinks.category', 'skillLinks', 'skillLinks.skill', 'media'],
    });
    if (!details) throw new NotFoundException('Professional details not found');
    return details;
  }

  async saveProfessionalDetails(userId: string, dto: UpdateProfessionalDetailsDto): Promise<ProviderProfessionalDetails> {
    const profile = await this.findOne(userId);
    const { categoryIds, skillIds, ratePerHourWeekday, ratePerHourWeekend, ratePerHourHoliday, subscriptionRate1Month, subscriptionRate3Months, subscriptionRate6Months, education, yearsOfExperience, bio, attachments } = dto;

    let details = await this.professionalDetailsRepository.findOne({ where: { profileId: profile.id } });
    if (!details) {
      details = this.professionalDetailsRepository.create({ profileId: profile.id });
    }

    // Rates are optional and nullable; POST is a full replace, so an omitted rate clears it (→ null),
    // consistent with education/bio below.
    details.ratePerHourWeekday = ratePerHourWeekday ?? null;
    details.ratePerHourWeekend = ratePerHourWeekend ?? null;
    details.ratePerHourHoliday = ratePerHourHoliday ?? null;
    details.subscriptionRate1Month = subscriptionRate1Month ?? null;
    details.subscriptionRate3Months = subscriptionRate3Months ?? null;
    details.subscriptionRate6Months = subscriptionRate6Months ?? null;
    details.education = education ?? null;
    details.yearsOfExperience = yearsOfExperience ?? null;
    details.bio = bio ?? null;
    await this.professionalDetailsRepository.save(details);

    // Replace categories
    await this.providerCategoryRepository
      .createQueryBuilder()
      .delete()
      .where('profile_id = :profileId', { profileId: profile.id })
      .execute();

    if (categoryIds.length > 0) {
      const links = categoryIds.map((catId) =>
        this.providerCategoryRepository.create({
          providerProfessionalDetails: details,
          category: { id: catId } as any,
        }),
      );
      await this.providerCategoryRepository.save(links);
    }

    // Replace skills
    await this.providerSkillRepository
      .createQueryBuilder()
      .delete()
      .where('profile_id = :profileId', { profileId: profile.id })
      .execute();

    if (skillIds.length > 0) {
      const skillLinks = skillIds.map((skillId) =>
        this.providerSkillRepository.create({
          providerProfessionalDetails: details,
          skill: { id: skillId } as any,
        }),
      );
      await this.providerSkillRepository.save(skillLinks);
    }

    // Replace media
    await this.providerMediaRepository.delete({ profileId: profile.id });
    if (attachments?.length) {
      const media = attachments.map((a) =>
        this.providerMediaRepository.create({
          profileId: profile.id,
          url: a.url,
          sortOrder: a.sortOrder ?? 0,
        }),
      );
      await this.providerMediaRepository.save(media);
    }

    return this.getProfessionalDetails(userId);
  }

  async patchProfessionalDetails(userId: string, dto: PatchProfessionalDetailsDto): Promise<ProviderProfessionalDetails> {
    const profile = await this.findOne(userId);
    const { categoryIds, skillIds, ratePerHourWeekday, ratePerHourWeekend, ratePerHourHoliday, subscriptionRate1Month, subscriptionRate3Months, subscriptionRate6Months, education, yearsOfExperience, bio, attachments } = dto;

    let details = await this.professionalDetailsRepository.findOne({ where: { profileId: profile.id } });
    if (!details) {
      details = this.professionalDetailsRepository.create({ profileId: profile.id });
    }

    if (ratePerHourWeekday !== undefined) details.ratePerHourWeekday = ratePerHourWeekday;
    if (ratePerHourWeekend !== undefined) details.ratePerHourWeekend = ratePerHourWeekend;
    if (ratePerHourHoliday !== undefined) details.ratePerHourHoliday = ratePerHourHoliday;
    if (subscriptionRate1Month !== undefined) details.subscriptionRate1Month = subscriptionRate1Month;
    if (subscriptionRate3Months !== undefined) details.subscriptionRate3Months = subscriptionRate3Months;
    if (subscriptionRate6Months !== undefined) details.subscriptionRate6Months = subscriptionRate6Months;
    if (education !== undefined) details.education = education;
    if (yearsOfExperience !== undefined) details.yearsOfExperience = yearsOfExperience;
    if (bio !== undefined) details.bio = bio;
    await this.professionalDetailsRepository.save(details);

    if (categoryIds !== undefined) {
      await this.providerCategoryRepository
        .createQueryBuilder()
        .delete()
        .where('profile_id = :profileId', { profileId: profile.id })
        .execute();

      if (categoryIds.length > 0) {
        const links = categoryIds.map((catId) =>
          this.providerCategoryRepository.create({
            providerProfessionalDetails: details,
            category: { id: catId } as any,
          }),
        );
        await this.providerCategoryRepository.save(links);
      }
    }

    if (skillIds !== undefined) {
      await this.providerSkillRepository
        .createQueryBuilder()
        .delete()
        .where('profile_id = :profileId', { profileId: profile.id })
        .execute();

      if (skillIds.length > 0) {
        const skillLinks = skillIds.map((skillId) =>
          this.providerSkillRepository.create({
            providerProfessionalDetails: details,
            skill: { id: skillId } as any,
          }),
        );
        await this.providerSkillRepository.save(skillLinks);
      }
    }

    if (attachments !== undefined) {
      await this.providerMediaRepository.delete({ profileId: profile.id });
      if (attachments.length > 0) {
        const media = attachments.map((a) =>
          this.providerMediaRepository.create({
            profileId: profile.id,
            url: a.url,
            sortOrder: a.sortOrder ?? 0,
          }),
        );
        await this.providerMediaRepository.save(media);
      }
    }

    return this.getProfessionalDetails(userId);
  }

  // ─── Work Info ───────────────────────────────────────────────────────────────

  async getWorkInfo(userId: string): Promise<ProviderWorkInfo> {
    const profile = await this.findOne(userId);
    const workInfo = await this.workInfoRepository.findOne({ where: { profileId: profile.id } });
    if (!workInfo) throw new NotFoundException('Work info not found');
    return workInfo;
  }

  async saveWorkInfo(userId: string, dto: UpdateWorkInfoDto): Promise<ProviderWorkInfo> {
    const profile = await this.findOne(userId);
    let workInfo = await this.workInfoRepository.findOne({ where: { profileId: profile.id } });
    if (!workInfo) {
      workInfo = this.workInfoRepository.create({ profileId: profile.id });
    }
    workInfo.businessName = dto.businessName;
    workInfo.abn = dto.abn;
    workInfo.acn = dto.acn ?? null;
    return this.workInfoRepository.save(workInfo);
  }

  async patchWorkInfo(userId: string, dto: PatchWorkInfoDto): Promise<ProviderWorkInfo> {
    const profile = await this.findOne(userId);
    let workInfo = await this.workInfoRepository.findOne({ where: { profileId: profile.id } });
    if (!workInfo) {
      workInfo = this.workInfoRepository.create({ profileId: profile.id });
    }
    if (dto.businessName !== undefined) workInfo.businessName = dto.businessName;
    if (dto.abn !== undefined) workInfo.abn = dto.abn;
    if (dto.acn !== undefined) workInfo.acn = dto.acn;
    return this.workInfoRepository.save(workInfo);
  }

  // ─── Employees ───────────────────────────────────────────────────────────────

  async getEmployees(userId: string): Promise<ProviderEmployee[]> {
    const profile = await this.findOne(userId);
    return this.providerEmployeeRepository.find({ where: { profileId: profile.id } });
  }

  async createEmployee(userId: string, dto: CreateEmployeeDto): Promise<ProviderEmployee> {
    const profile = await this.findOne(userId);
    const employee = this.providerEmployeeRepository.create({
      profileId: profile.id,
      name: dto.name,
      designation: dto.designation,
      avatarUrl: dto.avatarUrl,
    });
    return this.providerEmployeeRepository.save(employee);
  }

  async patchEmployee(userId: string, employeeId: string, dto: PatchEmployeeDto): Promise<ProviderEmployee> {
    const profile = await this.findOne(userId);
    const employee = await this.providerEmployeeRepository.findOne({
      where: { id: employeeId, profileId: profile.id },
    });
    if (!employee) throw new NotFoundException(`Employee "${employeeId}" not found`);

    if (dto.name !== undefined) employee.name = dto.name;
    if (dto.designation !== undefined) employee.designation = dto.designation;
    if (dto.avatarUrl !== undefined) employee.avatarUrl = dto.avatarUrl;

    return this.providerEmployeeRepository.save(employee);
  }

  async deleteEmployee(userId: string, employeeId: string): Promise<void> {
    const profile = await this.findOne(userId);
    const result = await this.providerEmployeeRepository.delete({
      id: employeeId,
      profileId: profile.id,
    });
    if (!result.affected) throw new NotFoundException(`Employee "${employeeId}" not found`);
  }

  // ─── Bank Details ─────────────────────────────────────────────────────────────

  async getBankDetails(userId: string): Promise<ProviderBankDetails> {
    const profile = await this.findOne(userId);
    const details = await this.bankDetailsRepository.findOne({ where: { profileId: profile.id } });
    if (!details) throw new NotFoundException('Bank details not found');
    return details;
  }

  //   helper method for saveBankDetails
  private async validateAndGetOnboardingData(userId: string, bankInfo: ProviderBankDetails, tosIp: string): Promise<IndividualOnboardingData> {
    const profile = await this.profileRepository.findOne({
      where: { user: { id: userId } as any },
      relations: ['user'],
    });

    if (!profile) {
      throw new BadRequestException('Provider profile not found for this user.');
    }

    const [workInfo, professionalDetails] = await Promise.all([
      this.workInfoRepository.findOne({ where: { profileId: profile.id } }),
      this.professionalDetailsRepository.findOne({
        where: { profileId: profile.id },
        relations: ['categoryLinks', 'categoryLinks.category'],
      }),
    ]);

    const missingFields: string[] = [];

    if (!profile.user?.email) missingFields.push('Email address');
    if (!profile.firstName) missingFields.push('First name');
    if (!profile.lastName) missingFields.push('Last name');
    if (!profile.phone) missingFields.push('Phone number');
    if (!profile.streetAddress) missingFields.push('Street address');
    if (!profile.suburb) missingFields.push('Suburb');
    if (!profile.state) missingFields.push('State');
    if (!profile.postcode) missingFields.push('Postcode');
    if (!profile.date_of_birth) missingFields.push('Date of birth');

    if (!workInfo) {
        missingFields.push('Work information');
    } else {
      if (!workInfo.businessName) missingFields.push('Business name');
      if (!workInfo.abn) missingFields.push('ABN');
    }

    if (missingFields.length > 0) {
      throw new BadRequestException(
        `Your profile is incomplete. Please fill in the following before requesting onboarding: ${missingFields.join(', ')}.`
      );
    }

    const dateOfBirth = new Date(profile.date_of_birth!);
    const normalisedState = normaliseAuState(profile.state!);
    const normalisedPostcode = profile.postcode!.trim().replace(/\D/g, '');

    const mcc = professionalDetails?.categoryLinks?.[0]?.category?.mcc ?? null;

    const identityStep = await this.verificationStepRepository.findOne({
      where: { case: { profileId: profile.id }, stepType: VerificationStepType.IDENTITY } as any,
      relations: ['files'],
    });
    // Resolve by label so front/back are never swapped. Records submitted before the
    // front/back split have a single unlabelled file — fall back to it as the front.
    const identityFiles = identityStep?.files ?? [];
    const frontFile = identityFiles.find((f) => f.label === 'front') ?? identityFiles.find((f) => !f.label) ?? identityFiles[0];
    const backFile = identityFiles.find((f) => f.label === 'back');
    const identityDocumentFrontUrl = frontFile?.fileUrl ?? null;
    const identityDocumentBackUrl = backFile?.fileUrl ?? null;

    return {
        userId: userId,
        providerId: profile.id,
        tosIpAddress: tosIp,
        bankAccountToken: 'btok_1234', // TODO: get from frontend

        individual: {
            firstName: profile!.firstName!,
            lastName: profile!.lastName!,
            email: profile!.user!.email!,
            phone: profile!.phone!,
            dob: {
                day: dateOfBirth.getDate(),
                month: dateOfBirth.getMonth() + 1,
                year: dateOfBirth.getFullYear()
            },
            address: {
                line1: profile!.streetAddress!,
                city: profile!.suburb!,
                state: normalisedState,
                postal_code: normalisedPostcode,
                country: 'AU'
            },
            idNumber: workInfo?.abn ?? null,
            identityDocumentFrontUrl,
            identityDocumentBackUrl,
        },

        businessProfile: { mcc },

        bankDetails: {
            accountNumber: bankInfo.accountNumber,
            bsbNumber: bankInfo.bsbNumber ?? '',
            accountHolderName: bankInfo.accountHolderName
        },
    };
  }

  async saveBankDetails(userId: string, dto: CreateBankDetailsDto, tosIp = '0.0.0.0'): Promise<ProviderBankDetails> {
    const profile = await this.findOne(userId);

    return await this.txHelper.run(async (qr) => {
        const existing = await qr.manager.findOne(ProviderBankDetails, { where: { profileId: profile.id } });

        const record = existing ?? qr.manager.create(ProviderBankDetails, { profileId: profile.id });

        record.bankName = dto.bankName;
        record.accountNumber = dto.accountNumber;
        record.bsbNumber = dto.bsbNumber ?? null;
        record.accountHolderName = dto.accountHolderName;

        const savedBankDetails = await qr.manager.save(ProviderBankDetails, record);

        // const validData = await this.validateAndGetOnboardingData(userId, savedBankDetails, tosIp);
        // await this.stripeService.onboardIndividualAccount(validData);

        return savedBankDetails;
    });
  }

  async initiateStripeOnboarding(userId: string, tosIp: string): Promise<any> {
    const profile = await this.findOne(userId);

    const verificationCase = await this.verificationCaseRepository.findOne({
        where: { profileId: profile.id },
    });

    if (!verificationCase) {
        throw new BadRequestException('You have not submitted your verification documents yet. Please complete your profile verification before requesting Stripe onboarding.');
    }

    const verificationMessages: Partial<Record<VerificationStatus, string>> = {
        [VerificationStatus.PENDING]:   'Your verification documents have not been submitted yet. Please submit all required documents to proceed.',
        [VerificationStatus.SUBMITTED]: 'Your documents have been submitted and are waiting to be reviewed. You will be notified once the review is complete.',
        [VerificationStatus.REJECTED]:  'Your verification was not approved. Please check your email for details and resubmit your documents.',
    };

    if (verificationCase.status !== VerificationStatus.APPROVED) {
        throw new BadRequestException(
            verificationMessages[verificationCase.status] ?? 'Your profile has not been approved yet. Please contact support if you believe this is an error.',
        );
    }

    const bankDetails = await this.bankDetailsRepository.findOne({
        where: { profileId: profile.id },
    });
    if (!bankDetails) {
        throw new BadRequestException('Please add your bank details before requesting Stripe onboarding.');
    }

    const validData = await this.validateAndGetOnboardingData(userId, bankDetails, tosIp);
    return this.stripeService.onboardIndividualAccount(validData);
  }

  async getStripeOnboardingStatus(userId: string): Promise<StripeOnboardingStatus> {
    return this.stripeService.getOnboardingStatus(userId);
  }

  async createStripeOnboardingLink(userId: string): Promise<{ url: string }> {
    return this.stripeService.createOnboardingAccountLink(userId);
  }

  async patchBankDetails(userId: string, dto: PatchBankDetailsDto): Promise<ProviderBankDetails> {
    const profile = await this.findOne(userId);
    const existing = await this.bankDetailsRepository.findOne({ where: { profileId: profile.id } });

    const record = existing ?? this.bankDetailsRepository.create({ profileId: profile.id });
    if (dto.bankName !== undefined) record.bankName = dto.bankName;
    if (dto.accountNumber !== undefined) record.accountNumber = dto.accountNumber;
    if (dto.bsbNumber !== undefined) record.bsbNumber = dto.bsbNumber;
    if (dto.accountHolderName !== undefined) record.accountHolderName = dto.accountHolderName;

    const saved = await this.bankDetailsRepository.save(record);

    const stripeRelevantFieldChanged = dto.accountNumber !== undefined || dto.bsbNumber !== undefined || dto.accountHolderName !== undefined;
    if (stripeRelevantFieldChanged) {
      const stripeStatus = await this.stripeService.getOnboardingStatus(userId);
      if (stripeStatus.onboarded && saved.accountNumber && saved.bsbNumber && saved.accountHolderName) {
        await this.stripeService.updateExternalBankAccount(userId, saved.accountNumber, saved.bsbNumber, saved.accountHolderName);
      }
    }

    return saved;
  }

  // ─── Certifications ───────────────────────────────────────────────────────────

  async getCertifications(userId: string): Promise<ProviderCertification[]> {
    const profile = await this.findOne(userId);
    return this.certificationRepository.find({ where: { profileId: profile.id } });
  }

  async createCertification(userId: string, dto: CreateCertificationDto): Promise<ProviderCertification> {
    const profile = await this.findOne(userId);
    const record = this.certificationRepository.create({
      profileId: profile.id,
      name: dto.name,
      licenseNumber: dto.licenseNumber ?? null,
      licenseType: dto.licenseType ?? null,
      state: dto.state ?? null,
      postcode: dto.postcode ?? null,
      status: CertificationStatus.PENDING,
    });
    const saved = await this.certificationRepository.save(record);
    this.eventEmitter.emit(new CertificationSubmittedEvent(profile.id, saved.id, saved.name, false));
    return saved;
  }

  async patchCertification(userId: string, certId: string, dto: PatchCertificationDto): Promise<ProviderCertification> {
    const profile = await this.findOne(userId);
    const record = await this.certificationRepository.findOne({
      where: { id: certId, profileId: profile.id },
    });
    if (!record) throw new NotFoundException(`Certification "${certId}" not found`);

    if (dto.name !== undefined) record.name = dto.name;
    if (dto.licenseNumber !== undefined) record.licenseNumber = dto.licenseNumber;
    if (dto.licenseType !== undefined) record.licenseType = dto.licenseType;
    if (dto.state !== undefined) record.state = dto.state;
    if (dto.postcode !== undefined) record.postcode = dto.postcode;

    const saved = await this.certificationRepository.save(record);
    this.eventEmitter.emit(new CertificationSubmittedEvent(profile.id, saved.id, saved.name, true));
    return saved;
  }

  async deleteCertification(userId: string, certId: string): Promise<void> {
    const profile = await this.findOne(userId);
    const result = await this.certificationRepository.delete({
      id: certId,
      profileId: profile.id,
    });
    if (!result.affected) throw new NotFoundException(`Certification "${certId}" not found`);
  }

  // ─── Browse Providers (Seeker) ────────────────────────────────────────────────

  async findProviders(seekerUserId: string, query: ProvidersQueryDto): Promise<PaginatedResponseDto<ProviderListItemDto>> {
    return this.queryProviders(seekerUserId, query, false);
  }

  async findPublicProviders(query: ProvidersQueryDto): Promise<PaginatedResponseDto<PublicProviderListItemDto>> {
    const result = await this.queryProviders(null, query, false);
    const items = result.items.map(({ isFavourite: _, categories, ...rest }) => ({
      ...rest,
      category: (categories as string[])[0] ?? null,
    }) as PublicProviderListItemDto);
    return new PaginatedResponseDto(items, result.total, result.page, result.limit);
  }

  async findFavouriteProviders(seekerUserId: string, query: ProvidersQueryDto): Promise<PaginatedResponseDto<ProviderListItemDto>> {
    return this.queryProviders(seekerUserId, query, true);
  }

  private async queryProviders(
    seekerUserId: string | null,
    query: ProvidersQueryDto,
    favouriteOnly: boolean,
  ): Promise<PaginatedResponseDto<ProviderListItemDto>> {
    const { search, categoryId, suburb, state, minRate, maxRate, sortBy, page, limit } = query;

    const buildFavouriteExists = (qb: any, alias: string): string =>
      qb
        .subQuery()
        .select('1')
        .from(SeekerFavouriteProvider, alias)
        .where(`${alias}.providerProfileId = profile.id`)
        .andWhere(`${alias}.seekerUserId = :seekerUserId`)
        .getQuery();

    const applyFilters = (qb: any) => {
      if (search) qb.andWhere('workInfo.businessName ILIKE :search', { search: `%${search}%` });
      if (categoryId) qb.andWhere('cat.id = :categoryId', { categoryId });
      if (suburb) qb.andWhere('LOWER(profile.suburb) = LOWER(:suburb)', { suburb });
      if (state) qb.andWhere('LOWER(profile.state) = LOWER(:state)', { state });
      if (minRate !== undefined) qb.andWhere('details.ratePerHourWeekday >= :minRate', { minRate });
      if (maxRate !== undefined) qb.andWhere('details.ratePerHourWeekday <= :maxRate', { maxRate });
      if (favouriteOnly && seekerUserId) {
        qb.andWhere(`EXISTS ${buildFavouriteExists(qb, 'sfp')}`, { seekerUserId });
      }
      // Only surface providers with a presentable, complete profile — same completeness the bidding
      // gate enforces: full personal details, a business name (their display name in the list) and at
      // least one service category. professionalDetails is already required by the inner join above.
      qb.andWhere(
        `profile.first_name IS NOT NULL AND profile.first_name <> '' ` +
        `AND profile.last_name IS NOT NULL AND profile.last_name <> '' ` +
        `AND profile.phone IS NOT NULL AND profile.phone <> '' ` +
        `AND profile.date_of_birth IS NOT NULL ` +
        `AND profile.street_address IS NOT NULL AND profile.street_address <> '' ` +
        `AND profile.suburb IS NOT NULL AND profile.suburb <> '' ` +
        `AND profile.state IS NOT NULL AND profile.state <> '' ` +
        `AND profile.postcode IS NOT NULL AND profile.postcode <> '' ` +
        `AND profile.country IS NOT NULL AND profile.country <> ''`,
      );
      qb.andWhere(`workInfo.business_name IS NOT NULL AND workInfo.business_name <> ''`);
      qb.andWhere(
        `EXISTS ${qb.subQuery().select('1').from(ProviderCategory, 'pcat').where('pcat.profile_id = profile.id').getQuery()}`,
      );
    };

    // ── Count query ───────────────────────────────────────────────────────────
    const countQb = this.profileRepository
      .createQueryBuilder('profile')
      .innerJoin('profile.user', 'u_cnt')
      .innerJoin('profile.professionalDetails', 'details')
      .leftJoin('profile.workInfo', 'workInfo')
      .leftJoin('details.categoryLinks', 'pc')
      .leftJoin('pc.category', 'cat')
      .where('u_cnt.role = :role', { role: UserRole.PROVIDER })
      // Exclude deactivated / suspended / deleted providers from seeker-facing discovery.
      .andWhere('u_cnt.isActive = true')
      .select('COUNT(DISTINCT profile.id)', 'cnt');

    applyFilters(countQb);
    const countResult = await countQb.getRawOne<{ cnt: string }>();
    const total = parseInt(countResult?.cnt ?? '0', 10);

    // ── Data query ────────────────────────────────────────────────────────────
    const qb = this.profileRepository
      .createQueryBuilder('profile')
      .innerJoin('profile.user', 'u')
      .innerJoin('profile.professionalDetails', 'details')
      .leftJoin('profile.workInfo', 'workInfo')
      .leftJoin('details.categoryLinks', 'pc')
      .leftJoin('pc.category', 'cat')
      .leftJoin('details.skillLinks', 'ps')
      .leftJoin('ps.skill', 'skill')
      .where('u.role = :role', { role: UserRole.PROVIDER })
      .andWhere('u.isActive = true')
      .leftJoin('provider_rating_summaries', 'prs', 'prs.provider_id = u.id')
      // Cached stats, recomputed off the PROVIDER_STATS queue. This replaces joining selections
      // and jobs here and aggregating per request: that put job rows into the same result set as
      // the category and skill joins, so each job counted once per (category x skill) and the
      // rate came back multiplied by that — 964.3% for a true 96.4%. A PK lookup cannot fan out.
      .leftJoin(ProviderPerformanceStats, 'pps', 'pps.provider_id = u.id')
      .select('"profile"."id"', 'id')
      .addSelect('MAX("workInfo"."business_name")', 'name')
      .addSelect('"profile"."avatar_url"', 'avatarUrl')
      .addSelect('"profile"."state"', 'state')
      .addSelect('"details"."rate_per_hour_weekday"::float', 'ratePerHourWeekday')
      .addSelect(`COALESCE(array_agg(DISTINCT "skill"."name") FILTER (WHERE "skill"."name" IS NOT NULL), '{}')`, 'skills')
      .addSelect('COALESCE(MAX(prs.average_rating), 0)', 'avgRating')
      .addSelect(
        `COALESCE(array_agg(DISTINCT cat.name) FILTER (WHERE cat.name IS NOT NULL), '{}')`,
        'categories',
      )

      // MAX() only to satisfy GROUP BY — pps is one row per provider, so it is that row's value.
      .addSelect('MAX(pps.job_success_rate)', 'jobSuccessRate')
      .addSelect(
        seekerUserId
          ? `EXISTS ${buildFavouriteExists(this.profileRepository.createQueryBuilder(), 'sfp2')}`
          : 'FALSE',
        'isFavourite',
      )
      .groupBy('"profile"."id"')
      .addGroupBy('"details"."profile_id"')
      .addGroupBy('"details"."rate_per_hour_weekday"');

    if (seekerUserId) qb.setParameter('seekerUserId', seekerUserId);
    applyFilters(qb);

    switch (sortBy) {
      case ProviderSortBy.RATING:
        qb.orderBy('COALESCE(MAX(prs.average_rating), 0)', 'DESC')
          .addOrderBy('COALESCE(MAX(prs.review_count), 0)', 'DESC');
        break;
      case ProviderSortBy.REVIEW_COUNT:
        qb.orderBy('COALESCE(MAX(prs.review_count), 0)', 'DESC');
        break;
      case ProviderSortBy.PRICE_ASC:
        qb.orderBy('"details"."rate_per_hour_weekday"', 'ASC');
        break;
      case ProviderSortBy.PRICE_DESC:
        qb.orderBy('"details"."rate_per_hour_weekday"', 'DESC');
        break;
      case ProviderSortBy.NEWEST:
        qb.orderBy('"profile"."created_at"', 'DESC');
        break;
      default:
        // Default to popularity: highest-rated first, then most-reviewed, then newest as a
        // deterministic tiebreak so equally-rated providers keep a stable order across pages.
        qb.orderBy('COALESCE(MAX(prs.average_rating), 0)', 'DESC')
          .addOrderBy('COALESCE(MAX(prs.review_count), 0)', 'DESC')
          .addOrderBy('"profile"."created_at"', 'DESC');
        break;
    }

    const data = await qb.offset((page - 1) * limit).limit(limit).getRawMany();
    return new PaginatedResponseDto(data, total, page, limit);
  }

  // ─── Provider Detail (Seeker) ─────────────────────────────────────────────────

  async findProviderById(seekerUserId: string, providerProfileId: string): Promise<ProviderDetailDto> {
    const buildFavouriteExists = (qb: any, alias: string): string =>
      qb
        .subQuery()
        .select('1')
        .from(SeekerFavouriteProvider, alias)
        .where(`${alias}.providerProfileId = profile.id`)
        .andWhere(`${alias}.seekerUserId = :seekerUserId`)
        .getQuery();

    // Provider-level verification: their KYC/verification case has been approved by an admin.
    const buildVerifiedExists = (qb: any, alias: string): string =>
      qb
        .subQuery()
        .select('1')
        .from(ProviderVerificationCase, alias)
        .where(`${alias}.profile_id = profile.id`)
        .andWhere(`${alias}.status = :verifiedStatus`)
        .getQuery();

    // Certified: the provider has at least one admin-verified certification.
    const buildCertifiedExists = (qb: any, alias: string): string =>
      qb
        .subQuery()
        .select('1')
        .from(ProviderCertification, alias)
        .where(`${alias}.profile_id = profile.id`)
        .andWhere(`${alias}.is_verified = true`)
        .getQuery();

    // ── Main scalar / aggregate query ────────────────────────────────────────
    const raw = await this.profileRepository
      .createQueryBuilder('profile')
      .innerJoin('profile.user', 'u')
      .innerJoin('profile.professionalDetails', 'details')
      .leftJoin('profile.workInfo', 'workInfo')
      .leftJoin('details.categoryLinks', 'pc')
      .leftJoin('pc.category', 'cat')
      .leftJoin('details.skillLinks', 'ps')
      .leftJoin('ps.skill', 'sk')
      .leftJoin('provider_rating_summaries', 'prs', 'prs.provider_id = u.id')
      // Cached stats, recomputed off the PROVIDER_STATS queue. The reviews and selections/jobs
      // joins that used to be here existed only to feed the rate aggregates; with those cached
      // they are dead weight, and removing them also removes the cross product that inflated
      // every rate in this query.
      .leftJoin(ProviderPerformanceStats, 'pps', 'pps.provider_id = u.id')
      .select('"profile"."id"', 'id')
      .addSelect('"workInfo"."business_name"', 'businessName')
      .addSelect('"profile"."avatar_url"', 'avatarUrl')
      .addSelect('"profile"."country"', 'country')
      .addSelect('"profile"."phone"', 'phone')
      .addSelect('"u"."email"', 'email')
      .addSelect('"details"."bio"', 'bio')
      .addSelect('"details"."rate_per_hour_weekday"::float', 'ratePerHourWeekday')
      .addSelect('"details"."rate_per_hour_weekend"::float', 'ratePerHourWeekend')
      .addSelect('"details"."rate_per_hour_holiday"::float', 'ratePerHourHoliday')
      .addSelect('"details"."subscription_rate_1_month"::float', 'subscriptionRate1Month')
      .addSelect('"details"."subscription_rate_3_months"::float', 'subscriptionRate3Months')
      .addSelect('"details"."subscription_rate_6_months"::float', 'subscriptionRate6Months')
      .addSelect('COALESCE(MAX(prs.average_rating), 0)', 'avgRating')
      .addSelect(
        `COALESCE(array_agg(DISTINCT cat.name) FILTER (WHERE cat.name IS NOT NULL), '{}')`,
        'categories',
      )
      // DISTINCT collapses the row multiplication that the skillLinks/categoryLinks left joins
      // create, so a provider with N categories and M skills still yields each name once.
      .addSelect(
        `COALESCE(array_agg(DISTINCT sk.name) FILTER (WHERE sk.name IS NOT NULL), '{}')`,
        'skills',
      )
      .addSelect('MAX(pps.jobs_done)', 'jobsDone')
      .addSelect('MAX(pps.rehired)', 'rehired')
      // All four rates come from the cached row. Previously each was aggregated inline over a
      // result set that cross-joined categories x reviews x jobs, so jobs and reviews inflated
      // one another: jobSuccessRate was multiplied by the review count and recommendationRate by
      // the job count. MAX() here only satisfies GROUP BY — pps holds one row per provider.
      .addSelect('MAX(pps.job_success_rate)', 'jobSuccessRate')
      .addSelect('MAX(pps.recommendation_rate)', 'recommendationRate')
      .addSelect('MAX(pps.on_time_rate)', 'onTimeRate')
      .addSelect('MAX(pps.on_budget_rate)', 'onBudgetRate')
      .addSelect(
        `EXISTS ${buildVerifiedExists(this.profileRepository.createQueryBuilder(), 'pvc')}`,
        'isVerified',
      )
      .addSelect(
        `EXISTS ${buildCertifiedExists(this.profileRepository.createQueryBuilder(), 'pc2')}`,
        'isCertified',
      )
      .addSelect(
        `EXISTS ${buildFavouriteExists(this.profileRepository.createQueryBuilder(), 'sfp')}`,
        'isFavourite',
      )
      .setParameter('seekerUserId', seekerUserId)
      .setParameter('verifiedStatus', VerificationStatus.APPROVED)
      .where('profile.id = :providerProfileId AND u.role = :role', { providerProfileId, role: UserRole.PROVIDER })
      // Deactivated / suspended / deleted providers are not viewable (404).
      .andWhere('u.isActive = true')
      .groupBy('"profile"."id"')
      .addGroupBy('"profile"."avatar_url"')
      .addGroupBy('"profile"."country"')
      .addGroupBy('"profile"."phone"')
      .addGroupBy('"u"."id"')
      .addGroupBy('"u"."email"')
      .addGroupBy('"details"."profile_id"')
      .addGroupBy('"details"."bio"')
      .addGroupBy('"details"."rate_per_hour_weekday"')
      .addGroupBy('"details"."rate_per_hour_weekend"')
      .addGroupBy('"details"."rate_per_hour_holiday"')
      .addGroupBy('"details"."subscription_rate_1_month"')
      .addGroupBy('"details"."subscription_rate_3_months"')
      .addGroupBy('"details"."subscription_rate_6_months"')
      .addGroupBy('"workInfo"."profile_id"')
      .addGroupBy('"workInfo"."business_name"')
      .getRawOne();

    if (!raw) throw new NotFoundException(`Provider "${providerProfileId}" not found`);

    // ── Employees (owner + staff) ─────────────────────────────────────────────
    const ownerProfile = await this.profileRepository.findOne({
      where: { id: providerProfileId },
      select: ['id', 'firstName', 'lastName', 'avatarUrl'],
    });

    const staffRows = await this.providerEmployeeRepository.find({
      where: { profileId: providerProfileId },
      order: { createdAt: 'ASC' },
    });

    const ownerEntry: ProviderDetailEmployeeDto = {
      id: ownerProfile!.id,
      name: [ownerProfile!.firstName, ownerProfile!.lastName].filter(Boolean).join(' ') || 'Owner',
      designation: 'Owner',
      isOwner: true,
    };

    const staffEntries: ProviderDetailEmployeeDto[] = staffRows.map((e) => ({
      id: e.id,
      name: e.name,
      designation: e.designation,
      isOwner: false,
    }));

    return {
      id: raw.id,
      businessName: raw.businessName ?? null,
      avatarUrl: raw.avatarUrl ?? null,
      categories: raw.categories ?? [],
      skills: raw.skills ?? [],
      country: raw.country ?? null,
      isVerified: raw.isVerified === true || raw.isVerified === 'true',
      isCertified: raw.isCertified === true || raw.isCertified === 'true',
      email: raw.email,
      phone: raw.phone ?? null,
      bio: raw.bio ?? null,
      ratePerHourWeekday: Number(raw.ratePerHourWeekday),
      ratePerHourWeekend: Number(raw.ratePerHourWeekend),
      ratePerHourHoliday: Number(raw.ratePerHourHoliday),
      subscriptionRate1Month: Number(raw.subscriptionRate1Month),
      subscriptionRate3Months: Number(raw.subscriptionRate3Months),
      subscriptionRate6Months: Number(raw.subscriptionRate6Months),
      avgRating: Number(raw.avgRating),
      jobsDone: Number(raw.jobsDone),
      rehired: Number(raw.rehired),
      jobSuccessRate: raw.jobSuccessRate != null ? Number(raw.jobSuccessRate) : null,
      recommendationRate: raw.recommendationRate != null ? Number(raw.recommendationRate) : null,
      onTimeRate: raw.onTimeRate != null ? Number(raw.onTimeRate) : null,
      onBudgetRate: raw.onBudgetRate != null ? Number(raw.onBudgetRate) : null,
      employees: [ownerEntry, ...staffEntries],
      isFavourite: raw.isFavourite === true || raw.isFavourite === 'true',
    };
  }

  // ─── Seeker Favourites ────────────────────────────────────────────────────────

  async addFavourite(seekerUserId: string, providerProfileId: string): Promise<IdResponseDto> {
    const providerExists = await this.profileRepository.existsBy({ id: providerProfileId });
    if (!providerExists) throw new NotFoundException(`Provider "${providerProfileId}" not found`);

    const existing = await this.favouriteRepository.findOneBy({ seekerUserId, providerProfileId });
    if (existing) return { id: existing.id, _message: 'Provider is already in your favourites list' } as IdResponseDto;

    const record = this.favouriteRepository.create({ seekerUserId, providerProfileId });
    const saved = await this.favouriteRepository.save(record);
    return { id: saved.id };
  }

  async removeFavourite(seekerUserId: string, providerProfileId: string): Promise<void> {
    const result = await this.favouriteRepository.delete({ seekerUserId, providerProfileId });
    if (!result.affected) throw new NotFoundException(`Favourite not found`);
  }

  // ─── Profile Completeness ─────────────────────────────────────────────────────

  async getCompleteness(userId: string, isProvider: boolean): Promise<ProfileStatusDto> {
    const profile = await this.profileRepository.findOne({
      where: { user: { id: userId } as any },
    });

    const check = (value: unknown): boolean => {
      if (value === null || value === undefined || value === '') return false;
      if (typeof value === 'number') return value > 0;
      return true;
    };

    const status = (complete: boolean): 'completed' | 'incomplete' => (complete ? 'completed' : 'incomplete');

    const profileComplete = [
      profile?.firstName, profile?.lastName, profile?.phone, profile?.date_of_birth,
      profile?.streetAddress, profile?.suburb, profile?.state, profile?.postcode,
    ].every(check);

    const result = new ProfileStatusDto();
    result.completed = false;
    result.phoneVerified = profile?.phoneVerified ?? false;
    result.profile = status(profileComplete);

    if (isProvider) {
      const profileId = profile?.id;

      const [workInfo, bankDetails, categoryCount, skillCount, employeeCount, certCount, verificationCase, stripeStatus] =
        await Promise.all([
          profileId ? this.workInfoRepository.findOne({ where: { profileId } }) : Promise.resolve(null),
          profileId ? this.bankDetailsRepository.findOne({ where: { profileId } }) : Promise.resolve(null),
          profileId
            ? this.providerCategoryRepository.createQueryBuilder('pc').where('pc.profile_id = :profileId', { profileId }).getCount()
            : Promise.resolve(0),
          profileId
            ? this.providerSkillRepository.createQueryBuilder('ps').where('ps.profile_id = :profileId', { profileId }).getCount()
            : Promise.resolve(0),
          profileId
            ? this.providerEmployeeRepository.createQueryBuilder('pe').where('pe.profile_id = :profileId', { profileId }).getCount()
            : Promise.resolve(0),
          profileId
            ? this.certificationRepository.createQueryBuilder('cert').where('cert.profile_id = :profileId', { profileId }).getCount()
            : Promise.resolve(0),
          profileId ? this.verificationCaseRepository.findOne({ where: { profileId } }) : Promise.resolve(null),
          this.stripeService.getOnboardingStatus(userId),
        ]);

      result.workInfo = status([workInfo?.businessName, workInfo?.abn].every(check));
      result.professionalDetails = status(categoryCount > 0 && skillCount > 0);
      result.employees = status(employeeCount > 0);
      result.verification = status(verificationCase?.status === VerificationStatus.APPROVED);
      result.certification = status(certCount > 0);
      result.stripeAccount = status(stripeStatus.onboarded);
      result.bankDetail = status(
        [bankDetails?.bankName, bankDetails?.accountNumber, bankDetails?.accountHolderName].every(check),
      );
    }

    result.completed =
      result.phoneVerified &&
      Object.entries(result)
        .filter(([k]) => k !== 'completed' && k !== 'phoneVerified')
        .every(([, v]) => v === 'completed');

    return result;
  }

  // ─── Phone OTP ───────────────────────────────────────────────────────────────

  private hashOtp(code: string, userId: string): string {
    const secret = process.env['DB_ENCRYPTION_KEY'] ?? 'fallback-otp-secret';
    return crypto.createHmac('sha256', secret).update(`${userId}:${code}`).digest('hex');
  }

  async sendPhoneOtp(userId: string): Promise<{ message: string }> {
    const profile = await this.findOne(userId);
    if (!profile.phone) throw new BadRequestException('No phone number on file — update your profile first');

    const cooldownKey = `phone_otp_cooldown:${userId}`;
    const onCooldown = await this.cacheService.get(cooldownKey);
    if (onCooldown) throw new BadRequestException('Please wait 60 seconds before requesting another OTP');

    const code = crypto.randomInt(100000, 1000000).toString();
    const hashedCode = this.hashOtp(code, userId);

    // Cooldown is set before the send, and deliberately not rolled back if the send fails.
    // It throttles the attempt, not the success: previously a failing provider left no cooldown,
    // so a caller could retry without limit and each retry sent another billable SMS at the
    // number. Cost of getting this wrong is a user waiting 60s after a transient failure.
    await this.cacheService.set(`phone_otp:${userId}`, { hash: hashedCode }, 300);
    await this.cacheService.set(cooldownKey, true, 60);

    await this.esendexService.sendSms(
      profile.phone,
      `Your Taskora verification code is ${code}. Valid for 5 minutes.`,
    );

    return { message: 'OTP sent to your phone number' };
  }

  async verifyPhoneOtp(userId: string, code: string): Promise<{ phoneVerified: boolean }> {
    const stored = await this.cacheService.get<{ hash: string }>(`phone_otp:${userId}`);
    if (!stored) throw new BadRequestException('OTP expired or not found — please request a new one');

    const hashedInput = this.hashOtp(code, userId);
    if (!crypto.timingSafeEqual(Buffer.from(stored.hash, 'hex'), Buffer.from(hashedInput, 'hex'))) {
      throw new BadRequestException('Invalid OTP');
    }

    await this.cacheService.del(`phone_otp:${userId}`);

    const profile = await this.findOne(userId);
    profile.phoneVerified = true;
    await this.profileRepository.save(profile);

    return { phoneVerified: true };
  }
}
