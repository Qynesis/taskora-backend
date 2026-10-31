import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { StripeService } from '../stripe/stripe.service';
import { Profile } from '../../database/entities/profile.entity';
import { ProviderVerificationCase } from '../../database/entities/provider_verification_cases.entity';
import { ProviderVerificationStep } from '../../database/entities/provider_verification_steps.entity';
import { ProviderVerificationStepFile } from '../../database/entities/provider_verification_step_files.entity';
import { StorageProvider, VerificationStepType, VerificationStatus, RejectionReason, RightToWorkStatus, IdentityType } from '../../database/common/enum';
import { TransactionHelper } from '../../database/transaction.helper';
import { AppCacheService } from '../../cache/cache.service';
import { DomainEventEmitter } from '../../events/domain-event-emitter.service';
import { VerificationCreatedEvent } from './events/verification-created.event';
import { VerificationStepReviewedEvent } from './events/verification-step-reviewed.event';
import { VerificationStepSubmittedEvent } from './events/verification-step-submitted.event';
import {
  SubmitBusinessDto,
  SubmitIdentityDto,
  SubmitPoliceCheckDto,
  SubmitRightToWorkDto,
  VerificationCaseResDto,
  VerificationStepResDto,
  BusinessStepResDto,
  IdentityStepResDto,
  RightToWorkStepResDto,
  PoliceCheckStepResDto,
  SelfieStepResDto,
} from './dto';

@Injectable()
export class VerificationService {
  constructor(
    @InjectRepository(Profile)
    private readonly profileRepository: Repository<Profile>,
    @InjectRepository(ProviderVerificationCase)
    private readonly caseRepository: Repository<ProviderVerificationCase>,
    @InjectRepository(ProviderVerificationStep)
    private readonly stepRepository: Repository<ProviderVerificationStep>,
    @InjectRepository(ProviderVerificationStepFile)
    private readonly fileRepository: Repository<ProviderVerificationStepFile>,
    private readonly txHelper: TransactionHelper,
    private readonly eventEmitter: DomainEventEmitter,
    private readonly stripeService: StripeService,
    private readonly configService: ConfigService,
    private readonly cacheService: AppCacheService,
  ) { }

  // Seeker provider view is cached per-seeker (providers:detail:<profileId>:seeker:<seekerId>);
  // prefix-scan clears every seeker's copy so `isVerified` updates immediately.
  private async invalidateSeekerProviderCache(profileId: string): Promise<void> {
    await this.cacheService.delByPrefix(`providers:detail:${profileId}:seeker:`);
  }

  private async resolveProfileId(userId: string): Promise<string> {
    const profile = await this.profileRepository.findOne({
      where: { user: { id: userId } as any },
    });
    if (!profile) {
      throw new NotFoundException('Profile not found. Please complete your profile setup to continue.');
    }
    return profile.id;
  }

  private async getOrCreateCase(profileId: string, userId: string): Promise<ProviderVerificationCase> {
    let vc = await this.caseRepository.findOne({ where: { profileId } });
    if (!vc) {
      vc = await this.txHelper.run(async (qr) => {
        const created = qr.manager.create(ProviderVerificationCase, { profileId });
        return qr.manager.save(created);
      });
      this.eventEmitter.emit(new VerificationCreatedEvent(profileId, profileId, userId));
    }
    return vc;
  }

  private async getOrCreateStep(
    vc: ProviderVerificationCase,
    stepType: VerificationStepType,
  ): Promise<ProviderVerificationStep> {
    let step = await this.stepRepository
      .createQueryBuilder('step')
      .where('step.case_id = :caseId AND step.step_type = :stepType', {
        caseId: vc.id,
        stepType,
      })
      .getOne();
    if (!step) {
      step = await this.txHelper.run(async (qr) => {
        const created = qr.manager.create(ProviderVerificationStep, {
          case: vc,
          stepType,
        });
        return qr.manager.save(created);
      });
    }
    return step;
  }

  private mapStepToDto(
    step: ProviderVerificationStep,
    files?: ProviderVerificationStepFile[],
  ): VerificationStepResDto {
    const base = {
      id: step.id,
      stepType: step.stepType,
      status: step.status,
      rejectionReason: step.rejectionReason ?? null,
      rejectionNote: step.rejectionNote ?? null,
    };

    const singleFile = files?.[0] ? { fileUrl: files[0].fileUrl } : null;

    switch (step.stepType) {
      case VerificationStepType.BUSINESS:
        return Object.assign(new BusinessStepResDto(), { ...base, abn: step.abn ?? null, file: singleFile });
      case VerificationStepType.IDENTITY:
        return Object.assign(new IdentityStepResDto(), {
          ...base,
          identityType: step.identityType ?? null,
          files: (files ?? []).map(f => ({ fileUrl: f.fileUrl, label: f.label ?? null })),
        });
      case VerificationStepType.RIGHT_TO_WORK:
        return Object.assign(new RightToWorkStepResDto(), {
          ...base,
          rightToWorkStatus: step.rightToWorkStatus ?? null,
          citizenDocumentType: step.citizenDocumentType ?? null,
          files: (files ?? []).map(f => ({ fileUrl: f.fileUrl, label: f.label ?? null })),
        });
      case VerificationStepType.POLICE_CHECK:
        return Object.assign(new PoliceCheckStepResDto(), { ...base, policeRefNo: step.policeRefNo ?? null, file: singleFile });
      default:
        return Object.assign(new SelfieStepResDto(), base);
    }
  }

  async getCase(userId: string): Promise<VerificationCaseResDto> {
    const profileId = await this.resolveProfileId(userId);
    const vc = await this.caseRepository.findOne({
      where: { profileId },
      relations: ['steps', 'steps.files'],
    });
    if (!vc) {
      throw new NotFoundException('Verification case not found');
    }
    return {
      status: vc.status,
      steps: (vc.steps ?? []).map(s => this.mapStepToDto(s, s.files ?? [])),
    };
  }

  private async markStepSubmittedAndUpdateCase(
    step: ProviderVerificationStep,
    profileId: string,
  ): Promise<void> {
    step.status = VerificationStatus.SUBMITTED;
    await this.stepRepository.save(step);
    await this.caseRepository.update({ profileId }, { status: VerificationStatus.SUBMITTED });
    this.eventEmitter.emit(new VerificationStepSubmittedEvent(profileId, step.stepType));
  }

  private async saveStepFile(
    step: ProviderVerificationStep,
    url: string,
  ): Promise<ProviderVerificationStepFile> {
    await this.fileRepository
      .createQueryBuilder()
      .delete()
      .from(ProviderVerificationStepFile)
      .where('step_id = :stepId', { stepId: step.id })
      .execute();

    return this.fileRepository.save(
      this.fileRepository.create({ step, fileUrl: url, storage: StorageProvider.AZURE_BLOB }),
    );
  }

  async submitBusiness(userId: string, dto: SubmitBusinessDto): Promise<VerificationStepResDto> {
    const profileId = await this.resolveProfileId(userId);
    const vc = await this.getOrCreateCase(profileId, userId);
    const step = await this.getOrCreateStep(vc, VerificationStepType.BUSINESS);
    step.abn = dto.abn;
    await this.stepRepository.save(step);
    const file = await this.saveStepFile(step, dto.fileUrl);
    await this.markStepSubmittedAndUpdateCase(step, profileId);
    return this.mapStepToDto(step, [file]);
  }

  async submitIdentity(userId: string, dto: SubmitIdentityDto): Promise<VerificationStepResDto> {
    const profileId = await this.resolveProfileId(userId);
    const vc = await this.getOrCreateCase(profileId, userId);
    const step = await this.getOrCreateStep(vc, VerificationStepType.IDENTITY);
    step.identityType = dto.identityType;
    await this.stepRepository.save(step);

    await this.fileRepository
      .createQueryBuilder()
      .delete()
      .from(ProviderVerificationStepFile)
      .where('step_id = :stepId', { stepId: step.id })
      .execute();

    // The front is always stored. A driving licence is two-sided, so its back is stored as a
    // second labelled file (Stripe's connected-account KYC needs both). A passport is single-page.
    const savedFiles: ProviderVerificationStepFile[] = [
      await this.fileRepository.save(
        this.fileRepository.create({ step, fileUrl: dto.frontUrl, storage: StorageProvider.AZURE_BLOB, label: 'front' }),
      ),
    ];

    if (dto.identityType === IdentityType.DRIVING_LICENSE) {
      savedFiles.push(
        await this.fileRepository.save(
          this.fileRepository.create({ step, fileUrl: dto.backUrl!, storage: StorageProvider.AZURE_BLOB, label: 'back' }),
        ),
      );
    }

    await this.markStepSubmittedAndUpdateCase(step, profileId);
    return this.mapStepToDto(step, savedFiles);
  }

  async submitRightToWork(userId: string, dto: SubmitRightToWorkDto): Promise<VerificationStepResDto> {
    const profileId = await this.resolveProfileId(userId);
    const vc = await this.getOrCreateCase(profileId, userId);
    const step = await this.getOrCreateStep(vc, VerificationStepType.RIGHT_TO_WORK);
    step.rightToWorkStatus = dto.rightToWorkStatus;

    await this.fileRepository
      .createQueryBuilder()
      .delete()
      .from(ProviderVerificationStepFile)
      .where('step_id = :stepId', { stepId: step.id })
      .execute();

    let savedFiles: ProviderVerificationStepFile[];

    if (dto.rightToWorkStatus === RightToWorkStatus.CITIZEN_PR) {
      step.citizenDocumentType = dto.citizenDocumentType ?? null;
      await this.stepRepository.save(step);
      const file = await this.fileRepository.save(
        this.fileRepository.create({ step, fileUrl: dto.fileUrl!, storage: StorageProvider.AZURE_BLOB }),
      );
      savedFiles = [file];
    } else {
      step.citizenDocumentType = null;
      await this.stepRepository.save(step);
      const [passport, vevo] = await Promise.all([
        this.fileRepository.save(
          this.fileRepository.create({ step, fileUrl: dto.passportFileUrl!, storage: StorageProvider.AZURE_BLOB, label: 'passport' }),
        ),
        this.fileRepository.save(
          this.fileRepository.create({ step, fileUrl: dto.vevoFileUrl!, storage: StorageProvider.AZURE_BLOB, label: 'vevo_check' }),
        ),
      ]);
      savedFiles = [passport, vevo];
    }

    await this.markStepSubmittedAndUpdateCase(step, profileId);
    return this.mapStepToDto(step, savedFiles);
  }

  async submitPoliceCheck(userId: string, dto: SubmitPoliceCheckDto): Promise<VerificationStepResDto> {
    const profileId = await this.resolveProfileId(userId);
    const vc = await this.getOrCreateCase(profileId, userId);
    const step = await this.getOrCreateStep(vc, VerificationStepType.POLICE_CHECK);
    if (dto.policeRefNo !== undefined) {
      step.policeRefNo = dto.policeRefNo;
    }
    await this.stepRepository.save(step);
    const file = await this.saveStepFile(step, dto.fileUrl);
    await this.markStepSubmittedAndUpdateCase(step, profileId);
    return this.mapStepToDto(step, [file]);
  }

  // ── Selfie (Stripe Identity) ──────────────────────────────────────────────

  async initiateSelfie(userId: string): Promise<{ url: string }> {
    const profileId = await this.resolveProfileId(userId);
    const vc = await this.getOrCreateCase(profileId, userId);
    const step = await this.getOrCreateStep(vc, VerificationStepType.SELFIE);

    const returnUrl = this.configService.get<string>('STRIPE_IDENTITY_RETURN_URL')
      ?? 'https://taskoraservices.com.au/verification';

    const { sessionId, url } = await this.stripeService.createIdentityVerificationSession(
      step.id,
      profileId,
      returnUrl,
    );

    // Creating the Stripe session only hands the provider a URL — it is NOT a submission.
    // The step stays PENDING until Stripe reports the provider actually submitted their
    // selfie/document (the `processing` webhook), so an abandoned or interrupted flow is
    // never left showing as "submitted".
    step.stripeIdentitySessionId = sessionId;
    await this.stepRepository.save(step);

    return { url };
  }

  async handleIdentitySessionVerified(sessionId: string): Promise<void> {
    const step = await this.stepRepository.findOne({
      where: { stripeIdentitySessionId: sessionId } as any,
      relations: ['case'],
    });
    if (!step) return;

    step.status = VerificationStatus.APPROVED;
    step.reviewedAt = new Date();
    await this.stepRepository.save(step);

    await this.recalculateCaseStatus(step.case.profileId);
  }

  /**
   * A case is only APPROVED once every required step type has an approved row. Steps the
   * provider has not submitted yet have no row at all, so counting "all existing steps are
   * approved" would approve a case off a single step — SELFIE auto-approves via Stripe
   * Identity, which was enough to mark providers verified with no police check or
   * right-to-work evidence on file.
   */
  private async recalculateCaseStatus(profileId: string): Promise<void> {
    const allSteps = await this.stepRepository.find({
      where: { case: { profileId } } as any,
    });

    const approvedTypes = new Set(
      allSteps.filter((s) => s.status === VerificationStatus.APPROVED).map((s) => s.stepType),
    );
    const allApproved = Object.values(VerificationStepType).every((t) => approvedTypes.has(t));
    const anyRejected = allSteps.some((s) => s.status === VerificationStatus.REJECTED);

    const newCaseStatus = allApproved
      ? VerificationStatus.APPROVED
      : anyRejected
        ? VerificationStatus.REJECTED
        : VerificationStatus.SUBMITTED;
    await this.caseRepository.update({ profileId }, { status: newCaseStatus });
  }

  async handleIdentitySessionProcessing(sessionId: string): Promise<void> {
    const step = await this.stepRepository.findOne({
      where: { stripeIdentitySessionId: sessionId } as any,
      relations: ['case'],
    });
    if (!step) return;

    // The provider has now actually submitted on Stripe's hosted flow — advance PENDING → SUBMITTED.
    await this.markStepSubmittedAndUpdateCase(step, step.case.profileId);
  }

  async handleIdentitySessionFailed(sessionId: string): Promise<void> {
    const step = await this.stepRepository.findOne({
      where: { stripeIdentitySessionId: sessionId } as any,
      relations: ['case'],
    });
    if (!step) return;

    step.status = VerificationStatus.PENDING;
    step.stripeIdentitySessionId = null;
    await this.stepRepository.save(step);
  }

  // ── Admin review ──────────────────────────────────────────────────────────

  async reviewStep(
    stepId: string,
    status: VerificationStatus.APPROVED | VerificationStatus.REJECTED,
    rejectionReason?: RejectionReason,
    rejectionNote?: string,
    actorId?: string,
  ): Promise<VerificationStepResDto> {
    const step = await this.stepRepository.findOne({
      where: { id: stepId } as any,
      relations: ['case', 'files'],
    });
    if (!step) throw new NotFoundException(`Verification step "${stepId}" not found`);

    // The selfie step's status is owned entirely by Stripe Identity webhooks; a manual admin
    // decision would race with (and could override) Stripe's automated result, so it is not reviewable.
    if (step.stepType === VerificationStepType.SELFIE) {
      throw new BadRequestException(
        'Selfie verification is handled automatically by Stripe Identity and cannot be reviewed manually',
      );
    }

    step.status = status;
    step.reviewedAt = new Date();
    step.rejectionReason = status === VerificationStatus.APPROVED ? null : (rejectionReason ?? null);
    step.rejectionNote = status === VerificationStatus.APPROVED ? null : (rejectionNote ?? null);
    await this.stepRepository.save(step);

    // Lock the legal name once identity is admin-approved so it can't drift from the verified
    // document / Stripe. Unlock on rejection so the provider can correct it and resubmit.
    if (step.stepType === VerificationStepType.IDENTITY) {
      await this.profileRepository.update(
        { id: step.case.profileId } as any,
        { nameLocked: status === VerificationStatus.APPROVED },
      );
      
      const profile = await this.profileRepository.findOne({
        where: { id: step.case.profileId } as any,
        select: ['user_id'],
      });
      if (profile?.user_id) await this.cacheService.del(`me:profile:${profile.user_id}`);
    }

    await this.recalculateCaseStatus(step.case.profileId);
    await this.invalidateSeekerProviderCache(step.case.profileId);

    this.eventEmitter.emit(
      new VerificationStepReviewedEvent(stepId, step.case.profileId, step.stepType, status, rejectionReason, rejectionNote, actorId),
    );

    return this.mapStepToDto(step, step.files ?? []);
  }
}
