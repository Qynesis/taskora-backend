import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Not, Repository, Brackets, Between } from 'typeorm';
import { money } from '../../interfaces/money.util';
import { User } from '../../database/entities/user.entity';
import { Job } from '../../database/entities/job.entity';
import { Bid } from '../../database/entities/bid.entity';
import { Payment } from '../../database/entities/payment.entity';
import { Refund } from '../../database/entities/refund.entity';
import { ProviderVerificationCase } from '../../database/entities/provider_verification_cases.entity';
import { ProviderCategory } from '../../database/entities/provider-category.entity';
import { ProviderCertification } from '../../database/entities/provider_certification.entity';
import { UserRole, VerificationStatus, CertificationStatus, PaymentStatus, JobStatus } from '../../database/common/enum';
import { PaginatedResponseDto } from '../../interfaces/paginated-response.dto';
import { SeekerQueryDto } from './dto/seeker-query.dto';
import { SeekerListItemDto, SeekerStatus } from './dto/seeker-list-item.dto';
import { SeekerDetailDto, RecentJobActivityDto } from './dto/seeker-detail.dto';
import { ProviderQueryDto } from './dto/provider-query.dto';
import { AdminProviderListItemDto, ProviderStatus } from './dto/provider-list-item.dto';
import { AdminProviderDetailDto, ProviderRecentActivityDto } from './dto/provider-detail.dto';
import { ProviderSummaryDto } from './dto/provider-summary.dto';
import { ReviewVerificationStepDto } from './dto/review-verification-step.dto';
import { VerificationSubmissionsQueryDto } from './dto/verification-submissions-query.dto';
import { VerificationService } from '../verification/verification.service';
import { VerificationCaseResDto } from '../verification/dto';
import { CertificationListItemDto } from './dto/certification-list-item.dto';
import { CertificationDetailDto } from './dto/certification-detail.dto';
import { CertificationProviderSummaryDto } from './dto/certification-provider-summary.dto';
import { CertificationQueryDto } from './dto/certification-query.dto';
import { DashboardSummaryDto } from './dto/dashboard-summary.dto';
import { RevenueChartDto, JobsChartDto, MonthlyRevenueDto, JobsOverviewDto } from './dto/dashboard-charts.dto';
import { AdminPaymentSummaryDto } from './dto/admin-payment-summary.dto';
import { AdminTransactionListItemDto } from './dto/admin-transaction-list-item.dto';
import { AdminPaymentQueryDto, TransactionTypeFilter } from './dto/admin-payment-query.dto';
import { AuditLogListItemDto } from './dto/audit-log-list-item.dto';

import { Transaction } from '../../database/entities/transaction.entity';
import { TransactionType } from '../../database/common/enum';
import { AuditService } from '../audit/audit.service';
import { AuditQueryDto } from '../audit/dto/audit-query.dto';
import { AuditLog } from '../../database/entities/audit-log.entity';
import { AppCacheService } from '../../cache/cache.service';
import { DomainEventEmitter } from '../../events/domain-event-emitter.service';
import { CertificationReviewedEvent } from '../profile/events/certification-reviewed.event';

const AUDIT_ACTION_LABELS: Record<string, string> = {
  JOB_CREATED: 'posted a job',
  JOB_STATUS_CHANGED: 'updated a job status',
  BID_PLACED: 'placed a bid',
  BID_STATUS_CHANGED: 'updated a bid status',
  PROVIDER_SELECTED: 'was selected for a job',
  BOOKING_CREATED: 'created a booking',
  PAYMENT_CREATED: 'made a payment',
  REPORT_SUBMITTED: 'submitted a report',
  VERIFICATION_OPENED: 'submitted verification',
  SUPPORT_TICKET_OPENED: 'opened a support ticket',
  USER_SUSPENDED: 'suspended a user account',
  USER_DEACTIVATED: 'deactivated a user account',
  USER_REACTIVATED: 'reactivated a user account',
  CERTIFICATION_REVIEWED: 'reviewed a certification',
  BID_UPDATED: 'updated a bid',
  BOOKING_STATUS_CHANGED: 'updated a booking status',
  REFUND_REQUESTED: 'requested a refund',
  REFUND_REJECTED: 'rejected a refund request',
  CARD_ADDED: 'added a payment card',
  PROFILE_CREATED: 'created their profile',
  REPORT_STATUS_CHANGED: 'updated a report status',
  REPORT_WARNING_SENT: 'sent a warning',
  VERIFICATION_STEP_REVIEWED: 'reviewed a verification step',
  SUBSCRIPTION_CANCELLATION_REQUESTED: 'requested subscription cancellation',
};

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Job)
    private readonly jobRepository: Repository<Job>,
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    @InjectRepository(Refund)
    private readonly refundRepository: Repository<Refund>,
    @InjectRepository(ProviderCertification)
    private readonly certificationRepository: Repository<ProviderCertification>,
    @InjectRepository(ProviderVerificationCase)
    private readonly providerVerificationCaseRepository: Repository<ProviderVerificationCase>,
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
    private readonly verificationService: VerificationService,
    private readonly auditService: AuditService,
    private readonly cacheService: AppCacheService,
    private readonly eventEmitter: DomainEventEmitter,
  ) {}

  //___ Dashboard _____________________________________________________________

  async dashboardSummary(): Promise<DashboardSummaryDto>{

    // count provider users
    const providerCount=await this.userRepository.count({
        where: {role: UserRole.PROVIDER, isActive: true}
    });

    // count seeker users
    const seekerCount=await this.userRepository.count({
        where: {role: UserRole.SEEKER, isActive: true}
    })

    // count total users
    const totalUser=providerCount+seekerCount;

    // Count jobs posted by seekers
    const seekerJobs = await this.jobRepository.count({
        where: { status: Not(In([JobStatus.CANCELLED])) }
    });

    // Count jobs where providers are engaged (DIRECT + active BIDDING)
    const providerJobsRaw = await this.jobRepository
        .createQueryBuilder('job')
        .leftJoin(Bid, 'bid', 'bid.job_id = job.id')
        .select('COUNT(DISTINCT job.id)', 'count')
        .where(
            '(job.provider_user_id IS NOT NULL) OR (bid.provider_user_id IS NOT NULL)'
        )
        .getRawOne<{ count: string }>();

    const providerJobs = Number(providerJobsRaw?.count ?? 0);

    const totalJobs = seekerJobs;

    // Revenue from actual transactions (captures both single-task and subscription cycles)
    const revenueAgg = await this.transactionRepository
        .createQueryBuilder('t')
        .select('COALESCE(SUM(t.amount), 0)::float', 'seekerTotal')
        .addSelect('COALESCE(SUM(t.provider_payout), 0)::float', 'providerTotal')
        .addSelect('COALESCE(SUM(t.platform_fee), 0)::float', 'platformTotal')
        .addSelect("COALESCE(MAX(t.currency), 'AUD')", 'currency')
        .where('t.type = :type', { type: TransactionType.PAYMENT })
        .getRawOne<{ seekerTotal: string; providerTotal: string; platformTotal: string; currency: string }>();

    const providerRevenue = { total: Number(revenueAgg?.providerTotal ?? 0) };
    const seekerRevenue = { total: Number(revenueAgg?.seekerTotal ?? 0) };
    const totalRevenue = Number(revenueAgg?.platformTotal ?? 0);
    const revenueCurrency = revenueAgg?.currency ?? 'AUD';

    // Provider verification case stats
    const [totalVerificationCases, pendingVerificationCount, verifiedCount] = await Promise.all([
        this.providerVerificationCaseRepository.count(),
        this.providerVerificationCaseRepository.count({
            where: { status: In([VerificationStatus.PENDING, VerificationStatus.SUBMITTED]) }
        }),
        this.providerVerificationCaseRepository.count({
            where: { status: VerificationStatus.APPROVED }
        }),
    ]);

    const dashboardSummary: DashboardSummaryDto = {
        user: {
            provider: providerCount,
            seeker: seekerCount,
            total: totalUser
        },
        jobs: {
            provider: providerJobs,
            seeker: seekerJobs,
            total: totalJobs
        },
        revenue: {
            provider: providerRevenue.total,
            seeker: seekerRevenue.total,
            total: totalRevenue
        },
        currency: revenueCurrency,
        pending_verifications: {
            total: totalVerificationCases,
            pending: pendingVerificationCount,
            verified: verifiedCount,
        }
    }

    return dashboardSummary;

  }

  private resolveTargetYear(year?: number): number {
    const targetYear = year || new Date().getFullYear();

    if (!Number.isInteger(targetYear) || targetYear < 1900 || targetYear > 2999) {
      throw new BadRequestException(`Invalid year: ${year}. Year must be a 4-digit number between 1900 and 2999.`);
    }

    return targetYear;
  }

  private initializeMonths(): { [key: number]: number } {
    const months: { [key: number]: number } = {};
    for (let i = 1; i <= 12; i++) {
      months[i] = 0;
    }
    return months;
  }

  private readonly monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  async getRevenueChart(year?: number): Promise<RevenueChartDto> {
    const targetYear = this.resolveTargetYear(year);
    const monthNames = this.monthNames;

    // ────────────────────────────────────────────────────────────────────────
    // 1. FETCH MONTHLY REVENUE (CURRENT YEAR) — platform fee from transactions
    // ────────────────────────────────────────────────────────────────────────
    const revenueData = await this.transactionRepository
      .createQueryBuilder('t')
      .select('EXTRACT(MONTH FROM t.created_at)::int', 'month')
      .addSelect('SUM(t.platform_fee)', 'revenue')
      .where('t.type = :type', { type: TransactionType.PAYMENT })
      .andWhere('EXTRACT(YEAR FROM t.created_at) = :year', { year: targetYear })
      .groupBy('EXTRACT(MONTH FROM t.created_at)')
      .orderBy('month', 'ASC')
      .getRawMany();

    const currentYearRevenue = this.initializeMonths();
    revenueData.forEach((row: any) => {
      const revenue = row.revenue ? Number(row.revenue) : 0;
      currentYearRevenue[row.month] = revenue;
    });

    // ────────────────────────────────────────────────────────────────────────
    // 2. FETCH MONTHLY REVENUE (PREVIOUS YEAR FOR YoY CALCULATION)
    // ────────────────────────────────────────────────────────────────────────
    const previousYear = targetYear - 1;
    const previousYearRevenueData = await this.transactionRepository
      .createQueryBuilder('t')
      .select('SUM(t.platform_fee)', 'revenue')
      .where('t.type = :type', { type: TransactionType.PAYMENT })
      .andWhere('EXTRACT(YEAR FROM t.created_at) = :year', { year: previousYear })
      .getRawOne();

    const currentYearTotalRevenue = Object.values(currentYearRevenue).reduce((sum, val) => sum + val, 0);
    const previousYearTotalRevenue = previousYearRevenueData?.revenue ? Number(previousYearRevenueData.revenue) : 0;

    // Calculate YoY change percentage
    let revenueChangePercent = 0;
    if (previousYearTotalRevenue > 0) {
      revenueChangePercent = parseFloat(
        (((currentYearTotalRevenue - previousYearTotalRevenue) / previousYearTotalRevenue) * 100).toFixed(1),
      );
    } else if (currentYearTotalRevenue > 0) {
      // If previous year was 0 but current year has revenue, don't show infinite change
      revenueChangePercent = 0;
    }

    // ────────────────────────────────────────────────────────────────────────
    // 3. BUILD RESPONSE DTO
    // ────────────────────────────────────────────────────────────────────────
    const monthlyRevenue: MonthlyRevenueDto[] = [];

    for (let month = 1; month <= 12; month++) {
      monthlyRevenue.push({
        month: monthNames[month - 1] as string,
        value: (currentYearRevenue[month] ?? 0) as number,
      });
    }

    return {
      year: targetYear,
      monthlyRevenue,
      revenueChangePercent,
    };
  }

  async getJobsChart(year?: number): Promise<JobsChartDto> {
    const targetYear = this.resolveTargetYear(year);
    const monthNames = this.monthNames;

    // ────────────────────────────────────────────────────────────────────────
    // 1. FETCH MONTHLY COMPLETED JOBS (CURRENT YEAR)
    // ────────────────────────────────────────────────────────────────────────
    const completedJobsData = await this.jobRepository
      .createQueryBuilder('job')
      .select('EXTRACT(MONTH FROM job.updated_at)::int', 'month')
      .addSelect('COUNT(job.id)', 'count')
      .where('job.status = :status', { status: JobStatus.COMPLETED })
      .andWhere('EXTRACT(YEAR FROM job.updated_at) = :year', { year: targetYear })
      .groupBy('EXTRACT(MONTH FROM job.updated_at)')
      .orderBy('month', 'ASC')
      .getRawMany();

    const completedJobs = this.initializeMonths();
    completedJobsData.forEach((row: any) => {
      const count = row.count ? Number(row.count) : 0;
      completedJobs[row.month] = count;
    });

    // ────────────────────────────────────────────────────────────────────────
    // 2. FETCH MONTHLY ACTIVE JOBS (CURRENT YEAR)
    // Active jobs: status IN (POSTED, BIDDING, SELECTED, PENDING, IN_PROGRESS)
    // ────────────────────────────────────────────────────────────────────────
    const activeJobsData = await this.jobRepository
      .createQueryBuilder('job')
      .select('EXTRACT(MONTH FROM job.created_at)::int', 'month')
      .addSelect('COUNT(job.id)', 'count')
      .andWhere(
        new Brackets((qb) => {
          qb.where('job.status = :status1', { status1: JobStatus.POSTED })
            .orWhere('job.status = :status2', { status2: JobStatus.BIDDING })
            .orWhere('job.status = :status3', { status3: JobStatus.SELECTED })
            .orWhere('job.status = :status4', { status4: JobStatus.PENDING })
            .orWhere('job.status = :status5', { status5: JobStatus.IN_PROGRESS });
        }),
      )
      .andWhere('EXTRACT(YEAR FROM job.created_at) = :year', { year: targetYear })
      .groupBy('EXTRACT(MONTH FROM job.created_at)')
      .orderBy('month', 'ASC')
      .getRawMany();

    const activeJobs = this.initializeMonths();
    activeJobsData.forEach((row: any) => {
      const count = row.count ? Number(row.count) : 0;
      activeJobs[row.month] = count;
    });

    // ────────────────────────────────────────────────────────────────────────
    // 3. FETCH COMPLETED JOBS COUNT (PREVIOUS YEAR FOR YoY CALCULATION)
    // ────────────────────────────────────────────────────────────────────────
    const previousYear = targetYear - 1;
    const previousYearCompletedCount = await this.jobRepository.count({
      where: {
        status: JobStatus.COMPLETED,
        updatedAt: Between(new Date(`${previousYear}-01-01`), new Date(`${previousYear + 1}-01-01`)),
      } as any,
    });

    const currentYearTotalCompletedJobs = Object.values(completedJobs).reduce((sum, val) => sum + val, 0);

    let jobChangePercent = 0;
    if (previousYearCompletedCount > 0) {
      jobChangePercent = parseFloat(
        (((currentYearTotalCompletedJobs - previousYearCompletedCount) / previousYearCompletedCount) * 100).toFixed(1),
      );
    } else if (currentYearTotalCompletedJobs > 0) {
      jobChangePercent = 0;
    }

    // ────────────────────────────────────────────────────────────────────────
    // 4. BUILD RESPONSE DTO
    // ────────────────────────────────────────────────────────────────────────
    const jobsOverview: JobsOverviewDto[] = [];

    for (let month = 1; month <= 12; month++) {
      jobsOverview.push({
        month: monthNames[month - 1] as string,
        completed: (completedJobs[month] ?? 0) as number,
        active: (activeJobs[month] ?? 0) as number,
      });
    }

    return {
      year: targetYear,
      jobsOverview,
      jobChangePercent,


    };
  }

  // ── Providers ─────────────────────────────────────────────────────────────

  async findAllProviders(query: ProviderQueryDto): Promise<PaginatedResponseDto<AdminProviderListItemDto>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const qb = this.userRepository
      .createQueryBuilder('user')
      .innerJoinAndSelect('user.profile', 'profile')
      .leftJoinAndSelect('profile.workInfo', 'workInfo')
      .leftJoinAndSelect('profile.professionalDetails', 'professionalDetails')
      .leftJoinAndSelect('professionalDetails.categoryLinks', 'categoryLinks')
      .leftJoinAndSelect('categoryLinks.category', 'category')
      .leftJoinAndMapOne(
        'profile.verificationCase',
        ProviderVerificationCase,
        'vc',
        'vc.profileId = profile.id',
      )
      // Include soft-deleted rows so suspended users (suspend soft-deletes) are listed and
      // labelled 'suspended' rather than silently dropped. Anonymized/user-deleted accounts are
      // not soft-deleted, so this does not surface them beyond what already showed as 'deleted'.
      .withDeleted()
      .where('user.role = :role', { role: UserRole.PROVIDER });

    if (query.isActive !== undefined) {
      qb.andWhere(query.isActive ? 'user.isActive = TRUE' : 'user.isActive = FALSE');
    }

    if (query.search) {
      qb.andWhere(
        '(profile.firstName ILIKE :search OR profile.lastName ILIKE :search OR user.email ILIKE :search OR workInfo.businessName ILIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    qb.orderBy('user.createdAt', 'DESC').skip(skip).take(limit);

    const [users, total] = await qb.getManyAndCount();

    const userIds = users.map((u) => u.id);
    const [earningsMap, ratingsMap] = await Promise.all([
      this.buildEarningsMap(userIds),
      this.buildRatingsMap(userIds),
    ]);

    const data = users.map((u) =>
      this.toProviderListItem(u, earningsMap.get(u.id) ?? { total: 0, currency: 'AUD' }, ratingsMap.get(u.id) ?? 0),
    );
    return new PaginatedResponseDto(data, total, page, limit);
  }

  async findOneProvider(id: string): Promise<AdminProviderDetailDto> {
    const user = await this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.profile', 'profile')
      .leftJoinAndSelect('profile.workInfo', 'workInfo')
      .leftJoinAndSelect('profile.professionalDetails', 'professionalDetails')
      .leftJoinAndSelect('professionalDetails.categoryLinks', 'categoryLinks')
      .leftJoinAndSelect('categoryLinks.category', 'category')
      .leftJoinAndMapOne(
        'profile.verificationCase',
        ProviderVerificationCase,
        'vc',
        'vc.profileId = profile.id',
      )
      .where('user.id = :id', { id })
      .andWhere('user.role = :role', { role: UserRole.PROVIDER })
      .getOne();

    if (!user) throw new NotFoundException(`Provider "${id}" not found`);

    const [earningsMap, ratingsMap] = await Promise.all([
      this.buildEarningsMap([id]),
      this.buildRatingsMap([id]),
    ]);

    const recentPayments = await this.paymentRepository.find({
      where: { provider: { id } } as any,
      relations: ['job'],
      order: { createdAt: 'DESC' },
      take: 5,
    });

    const recentActivity: ProviderRecentActivityDto[] = recentPayments.map((p) => ({
      type: 'payment_received' as const,
      title: p.job ? `Payment received for "${p.job.title}"` : 'Subscription payment received',
    }));

    return {
      ...this.toProviderListItem(user, earningsMap.get(id) ?? { total: 0, currency: 'AUD' }, ratingsMap.get(id) ?? 0),
      email: user.email,
      phone: user.profile?.phone ?? null,
      dateOfBirth: (user.profile?.date_of_birth as unknown as string) ?? null,
      recentActivity,
    };
  }

  async getProviderVerificationCase(userId: string): Promise<VerificationCaseResDto> {
    return this.verificationService.getCase(userId);
  }

  async reviewVerificationStep(stepId: string, dto: ReviewVerificationStepDto, actorId?: string) {
    return this.verificationService.reviewStep(
      stepId,
      dto.status,
      dto.rejectionReason,
      dto.rejectionNote,
      actorId,
    );
  }

  async getVerificationSubmissions(query: VerificationSubmissionsQueryDto = {}): Promise<ProviderSummaryDto[]> {
    const qb = this.userRepository
      .createQueryBuilder('user')
      .innerJoinAndSelect('user.profile', 'profile')
      .innerJoinAndSelect('profile.verificationCase', 'vc')
      .leftJoinAndSelect('profile.workInfo', 'workInfo')
      .leftJoinAndSelect('profile.professionalDetails', 'professionalDetails')
      .leftJoinAndSelect('professionalDetails.categoryLinks', 'categoryLinks')
      .leftJoinAndSelect('categoryLinks.category', 'category')
      .where('user.role = :role', { role: UserRole.PROVIDER });

    if (query.status) {
      // "pending" from the admin UI means pending *admin review*, which is SUBMITTED in the
      // case's own vocabulary. PENDING is only the column default and never persists — every
      // path that creates a case submits a step in the same request — so treating it as a
      // literal filter matches nothing.
      const status =
        query.status === VerificationStatus.PENDING ? VerificationStatus.SUBMITTED : query.status;
      qb.andWhere('vc.status = :status', { status });
    }

    if (query.month) {
      const year = new Date().getFullYear();
      const from = new Date(year, query.month - 1, 1);
      const to = new Date(year, query.month, 1);
      qb.andWhere('vc.createdAt >= :from AND vc.createdAt < :to', { from, to });
    }

    const users = await qb.orderBy('user.createdAt', 'DESC').getMany();

    return users.map((user) => {
      const profile = user.profile;
      const firstName = profile?.firstName ?? '';
      const lastName = profile?.lastName ?? '';
      const fullName = [firstName, lastName].filter(Boolean).join(' ') || null;
      const categories = (profile?.professionalDetails?.categoryLinks ?? [])
        .map((cl: ProviderCategory) => cl.category?.name)
        .filter(Boolean) as string[];
      const submissionDate = profile?.verificationCase?.createdAt
        ? new Date(profile.verificationCase.createdAt).toISOString()
        : null;
      return { id: user.id, name: fullName, categories, submissionDate };
    });
  }

  // ── Seekers ───────────────────────────────────────────────────────────────

  async findAllSeekers(query: SeekerQueryDto): Promise<PaginatedResponseDto<SeekerListItemDto>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const qb = this.userRepository
      .createQueryBuilder('user')
      .innerJoinAndSelect('user.profile', 'profile')
      .loadRelationCountAndMap('user.totalJobs', 'user.jobs')
      // See findAllProviders: withDeleted keeps suspended (soft-deleted) seekers in the list.
      .withDeleted()
      .where('user.role = :role', { role: UserRole.SEEKER });

    if (query.isActive !== undefined) {
      qb.andWhere(query.isActive ? 'user.isActive = TRUE' : 'user.isActive = FALSE');
    }

    if (query.search) {
      qb.andWhere(
        '(profile.first_name ILIKE :search OR profile.last_name ILIKE :search OR user.email ILIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    qb.orderBy('user.createdAt', 'DESC').skip(skip).take(limit);

    const [users, total] = await qb.getManyAndCount();

    const data = users.map((u) => this.toSeekerListItem(u));
    return new PaginatedResponseDto(data, total, page, limit);
  }

  async findOneSeeker(id: string): Promise<SeekerDetailDto> {
    const user = await this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.profile', 'profile')
      .loadRelationCountAndMap('user.totalJobs', 'user.jobs')
      .where('user.id = :id', { id })
      .andWhere('user.role = :role', { role: UserRole.SEEKER })
      .getOne();

    if (!user) {
      throw new NotFoundException(`Seeker "${id}" not found`);
    }

    const recentJobs = await this.jobRepository.find({
      where: { seeker: { id } } as any,
      order: { createdAt: 'DESC' },
      take: 10,
      select: ['id', 'title', 'createdAt'],
    });

    const recentPayments = await this.paymentRepository.find({
      where: { seeker: { id } } as any,
      relations: ['job'],
      order: { createdAt: 'DESC' },
      take: 10,
    });

    const activities: (RecentJobActivityDto & { _date: Date })[] = [
      ...recentJobs.map((j) => ({
        type: 'job_posted' as const,
        title: `Posted job: "${j.title}"`,
        _date: j.createdAt,
      })),
      ...recentPayments.map((p) => ({
        type: 'payment' as const,
        title: p.job ? `Payment for "${p.job.title}"` : 'Subscription payment',
        _date: p.createdAt,
      })),
    ];

    const recentActivity: RecentJobActivityDto[] = activities
      .sort((a, b) => b._date.getTime() - a._date.getTime())
      .slice(0, 5)
      .map(({ type, title }) => ({ type, title }));

    return {
      ...this.toSeekerListItem(user),
      phone: user.profile?.phone ?? null,
      recentActivity,
    };
  }

  // ── Certifications ────────────────────────────────────────────────────────

  async getCertificationsByProvider(
    providerId: string,
  ): Promise<CertificationListItemDto[]> {
    const user = await this.userRepository.findOne({
      where: { id: providerId, role: UserRole.PROVIDER },
      relations: ['profile'],
    });
    if (!user) throw new NotFoundException(`Provider "${providerId}" not found`);
    if (!user.profile) return [];

    const certs = await this.certificationRepository.find({
      where: { profileId: user.profile.id },
      order: { createdAt: 'DESC' },
    });

    const firstName = user.profile.firstName ?? '';
    const lastName = user.profile.lastName ?? '';
    const providerName = [firstName, lastName].filter(Boolean).join(' ') || 'Unknown';
    const providerAvatarUrl = user.profile.avatarUrl ?? null;

    return certs.map((cert) => ({
      id: cert.id,
      providerId,
      providerAvatarUrl,
      providerName,
      status: cert.status,
      submittedOn: cert.createdAt,
    }));
  }

  async getAllCertifications(
    query: CertificationQueryDto,
  ): Promise<PaginatedResponseDto<CertificationProviderSummaryDto>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const { status, month } = query;
    const year = new Date().getFullYear();

    const latestCertCondition = (subQb: any) => {
      const sub = subQb
        .subQuery()
        .select('MAX(c2.created_at)')
        .from(ProviderCertification, 'c2')
        .where('c2.profile_id = cert.profile_id')
        .getQuery();
      return `cert.created_at = ${sub}`;
    };

    const countQb = this.certificationRepository
      .createQueryBuilder('cert')
      .select('COUNT(*)::int', 'count')
      .where(latestCertCondition);
    if (status) countQb.andWhere('cert.status = :status', { status });
    if (month) countQb.andWhere('EXTRACT(MONTH FROM cert.created_at) = :month AND EXTRACT(YEAR FROM cert.created_at) = :year', { month, year });

    const total = (await countQb.getRawOne<{ count: number }>())?.count ?? 0;

    if (!total) return new PaginatedResponseDto([], 0, page, limit);

    const dataQb = this.certificationRepository
      .createQueryBuilder('cert')
      .innerJoin('cert.profile', 'profile')
      .innerJoin('profile.user', 'user')
      .select('user.id', 'providerId')
      .addSelect('profile.firstName', 'firstName')
      .addSelect('profile.lastName', 'lastName')
      .addSelect('profile.avatarUrl', 'providerAvatarUrl')
      .addSelect('cert.createdAt', 'submittedOn')
      .addSelect('cert.status', 'status')
      .where(latestCertCondition);
    if (status) dataQb.andWhere('cert.status = :status', { status });
    if (month) dataQb.andWhere('EXTRACT(MONTH FROM cert.created_at) = :month AND EXTRACT(YEAR FROM cert.created_at) = :year', { month, year });

    const rows = await dataQb
      .orderBy('cert.createdAt', 'DESC')
      .offset(skip)
      .limit(limit)
      .getRawMany<{
        providerId: string;
        firstName: string | null;
        lastName: string | null;
        providerAvatarUrl: string | null;
        submittedOn: Date;
        status: CertificationStatus;
      }>();

    const data = rows.map((row) => ({
      providerId: row.providerId,
      providerName: [row.firstName ?? '', row.lastName ?? ''].filter(Boolean).join(' ') || 'Unknown',
      providerAvatarUrl: row.providerAvatarUrl,
      submittedOn: row.submittedOn,
      status: row.status,
    }));

    return new PaginatedResponseDto(data, total, page, limit);
  }

  async getCertificationById(certId: string): Promise<CertificationDetailDto> {
    const cert = await this.certificationRepository.findOneBy({ id: certId });
    if (!cert) throw new NotFoundException(`Certification "${certId}" not found`);

    return {
      id: cert.id,
      name: cert.name,
      licenseNumber: cert.licenseNumber ?? null,
      licenseType: cert.licenseType ?? null,
      state: cert.state ?? null,
      postcode: cert.postcode ?? null,
      status: cert.status,
      isVerified: cert.isVerified,
      submittedOn: cert.createdAt,
    };
  }

  async reviewCertification(certId: string, status: CertificationStatus, actorId?: string): Promise<ProviderCertification> {
    const cert = await this.certificationRepository.findOneBy({ id: certId });
    if (!cert) throw new NotFoundException(`Certification "${certId}" not found`);
    cert.status = status;
    cert.isVerified = status === CertificationStatus.ACCEPTED;
    const saved = await this.certificationRepository.save(cert);
    // Clear every seeker's cached provider view so `isCertified` updates immediately.
    await this.cacheService.delByPrefix(`providers:detail:${cert.profileId}:seeker:`);
    this.eventEmitter.emit(new CertificationReviewedEvent(cert.profileId, cert.id, cert.name, status, actorId));
    await this.auditService.log({
      action: 'CERTIFICATION_REVIEWED',
      entityType: 'certification',
      entityId: certId,
      actorId,
      metadata: { status },
    });
    return saved;
  }

  // ── Payments ──────────────────────────────────────────────────────────────

  async getPaymentSummary(): Promise<AdminPaymentSummaryDto> {
    const manager = this.paymentRepository.manager;

    // Money figures come from the transaction ledger (one row per actual charge / cycle).
    // platform_fee excludes GST; gst is remitted to the ATO (not revenue); totalTransactions
    // counts real money movements, so each subscription cycle is counted individually.
    const row = await manager.query<{ platformRevenue: string; gstCollected: string; totalTransactions: string; totalRefunded: string; currency: string }[]>(`
      SELECT
        COALESCE(SUM(t.platform_fee), 0)::float                                             AS "platformRevenue",
        COALESCE(SUM(t.tax_gst_amount), 0)::float                                           AS "gstCollected",
        COUNT(*)::int                                                                       AS "totalTransactions",
        COALESCE((SELECT SUM(r.amount) FROM refunds r), 0)::float                            AS "totalRefunded",
        COALESCE(MAX(t.currency), 'AUD')                                                     AS "currency"
      FROM transactions t
      WHERE t.type = 'payment'
    `);

    const r = row[0]!;
    return {
      platformRevenue: money(r.platformRevenue),
      gstCollected: money(r.gstCollected),
      totalTransactions: Number(r.totalTransactions),
      totalRefunded: money(r.totalRefunded),
      currency: r.currency,
    };
  }

  async getTransactionList(query: AdminPaymentQueryDto): Promise<PaginatedResponseDto<AdminTransactionListItemDto>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const offset = (page - 1) * limit;
    const manager = this.paymentRepository.manager;

    const params: unknown[] = [];
    let paramIdx = 1;
    const currentYear = new Date().getFullYear();

    // Seeded with TRUE so `WHERE ${...join(' AND ')}` stays valid when no date filter applies.
    const paymentDateFilter: string[] = ['TRUE'];
    const refundDateFilter: string[] = ['TRUE'];

    if (query.month) {
      paymentDateFilter.push(`EXTRACT(MONTH FROM p.created_at) = $${paramIdx}`);
      refundDateFilter.push(`EXTRACT(MONTH FROM r.created_at) = $${paramIdx}`);
      params.push(query.month);
      paramIdx++;
      paymentDateFilter.push(`EXTRACT(YEAR FROM p.created_at) = $${paramIdx}`);
      refundDateFilter.push(`EXTRACT(YEAR FROM r.created_at) = $${paramIdx}`);
      params.push(currentYear);
      paramIdx++;
    } else if (query.week) {
      paymentDateFilter.push(`EXTRACT(WEEK FROM p.created_at) = $${paramIdx}`);
      refundDateFilter.push(`EXTRACT(WEEK FROM r.created_at) = $${paramIdx}`);
      params.push(query.week);
      paramIdx++;
      paymentDateFilter.push(`EXTRACT(YEAR FROM p.created_at) = $${paramIdx}`);
      refundDateFilter.push(`EXTRACT(YEAR FROM r.created_at) = $${paramIdx}`);
      params.push(currentYear);
      paramIdx++;
    }

    const senderCols = `
      COALESCE(NULLIF(TRIM(COALESCE(pr.first_name,'') || ' ' || COALESCE(pr.last_name,'')), ''), u.email) AS "senderName",
      u.email AS "senderEmail"
    `;

    const paymentSelect = `
      SELECT p.id AS "transactionId", 'payment' AS "type",
             p.amount::float AS "amount", p.currency, p.created_at AS "date",
             ${senderCols}
      FROM payments p
      JOIN users u ON p.seeker_user_id = u.id
      LEFT JOIN profiles pr ON pr.user_id = u.id
      WHERE ${paymentDateFilter.join(' AND ')}
    `;

    const refundSelect = `
      SELECT r.id AS "transactionId", 'refund' AS "type",
             r.amount::float AS "amount", p.currency, r.created_at AS "date",
             ${senderCols}
      FROM refunds r
      JOIN payments p ON r.payment_id = p.id
      JOIN users u ON p.seeker_user_id = u.id
      LEFT JOIN profiles pr ON pr.user_id = u.id
      WHERE ${refundDateFilter.join(' AND ')}
    `;

    let unionSql: string;
    if (query.type === TransactionTypeFilter.PAYMENT) {
      unionSql = paymentSelect;
    } else if (query.type === TransactionTypeFilter.REFUND) {
      unionSql = refundSelect;
    } else {
      unionSql = `${paymentSelect} UNION ALL ${refundSelect}`;
    }

    const [rows, countRows] = await Promise.all([
      manager.query<AdminTransactionListItemDto[]>(
        `SELECT * FROM (${unionSql}) t ORDER BY t."date" DESC LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`,
        [...params, limit, offset],
      ),
      manager.query<[{ count: string }]>(
        `SELECT COUNT(*)::int AS count FROM (${unionSql}) t`,
        params,
      ),
    ]);

    return new PaginatedResponseDto(rows, Number(countRows[0]?.count ?? 0), page, limit);
  }

  async exportPaymentsCsv(): Promise<{ data: string; filename: string }> {
    const { items } = await this.getTransactionList({ page: 1, limit: 10000, sortBy: 'createdAt', order: 'DESC' });

    const header = 'Transaction ID,Type,Sender,Email,Amount,Currency,Date';
    const lines = items.map((row: AdminTransactionListItemDto) => {
      const date = new Date(row.date).toISOString();
      const name = `"${row.senderName.replace(/"/g, '""')}"`;
      const email = `"${row.senderEmail.replace(/"/g, '""')}"`;
      return `${row.transactionId},${row.type},${name},${email},${row.amount},${row.currency},${date}`;
    });

    const csv = [header, ...lines].join('\n');
    return {
      data: Buffer.from(csv, 'utf8').toString('base64'),
      filename: `payments-${new Date().toISOString().slice(0, 10)}.csv`,
    };
  }

  // ── Audit Logs ────────────────────────────────────────────────────────────

  async getAuditLogs(query: AuditQueryDto): Promise<PaginatedResponseDto<AuditLogListItemDto>> {
    const { items, total, page, limit } = await this.auditService.findAll(query);
    return new PaginatedResponseDto(items.map((log) => this.toAuditLogListItem(log)), total, page, limit);
  }

  private toAuditLogListItem(log: AuditLog): AuditLogListItemDto {
    const profile = log.actor?.profile;
    const firstName = profile?.firstName ?? '';
    const lastName = profile?.lastName ?? '';
    const actorName = [firstName, lastName].filter(Boolean).join(' ') || log.actor?.email || 'System';

    return {
      actorName,
      actorAvatarUrl: profile?.avatarUrl ?? null,
      action: AUDIT_ACTION_LABELS[log.action] ?? log.action.replace(/_/g, ' ').toLowerCase(),
      createdAt: log.createdAt,
    };
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private async buildRatingsMap(userIds: string[]): Promise<Map<string, number>> {
    if (!userIds.length) return new Map();
    const rows = await this.userRepository.manager
      .createQueryBuilder()
      .select('prs.provider_id', 'providerId')
      .addSelect('COALESCE(prs.average_rating, 0)', 'avgRating')
      .from('provider_rating_summaries', 'prs')
      .where('prs.provider_id IN (:...userIds)', { userIds })
      .getRawMany<{ providerId: string; avgRating: string }>();
    return new Map(rows.map((r) => [r.providerId, Number(r.avgRating)]));
  }

  private async buildEarningsMap(userIds: string[]): Promise<Map<string, { total: number; currency: string }>> {
    if (!userIds.length) return new Map();
    // Provider earnings come from the transaction ledger (actual payouts per money movement),
    // grouped by the owning payment's provider — not from a denormalized Payment column.
    const rows = await this.transactionRepository
      .createQueryBuilder('t')
      .innerJoin('t.payment', 'p')
      .select('p.provider_user_id', 'userId')
      .addSelect('COALESCE(SUM(t.provider_payout), 0)::float', 'total')
      .addSelect('MAX(t.currency)', 'currency')
      .where('p.provider_user_id IN (:...userIds)', { userIds })
      .andWhere('t.type = :type', { type: TransactionType.PAYMENT })
      .groupBy('p.provider_user_id')
      .getRawMany<{ userId: string; total: string; currency: string | null }>();
    return new Map(rows.map((r) => [r.userId, { total: parseFloat(r.total), currency: r.currency ?? 'AUD' }]));
  }

  private toProviderListItem(user: User, earnings: { total: number; currency: string }, avgRating: number = 0): AdminProviderListItemDto {
    const { total: totalEarnings, currency } = earnings;
    const profile = user.profile;
    const firstName = profile?.firstName ?? '';
    const lastName = profile?.lastName ?? '';
    const fullName = [firstName, lastName].filter(Boolean).join(' ') || null;

    const primaryCategory = profile?.professionalDetails?.categoryLinks?.[0]?.category?.name ?? null;
    const verificationCase = (profile as any)?.verificationCase as
      | ProviderVerificationCase
      | undefined;

    return {
      id: user.id,
      name: fullName,
      category: primaryCategory,
      rating: avgRating,
      status: (user.accountDeletedAt
        ? 'deleted'
        : user.isSuspended
        ? 'suspended'
        : user.isActive
        ? 'active'
        : 'inactive') as ProviderStatus,
      joinedAt: user.createdAt,
      totalEarnings,
      currency,
      verificationStatus: verificationCase?.status ?? VerificationStatus.PENDING,
    };
  }

  private toSeekerListItem(user: User & { totalJobs?: number }): SeekerListItemDto {
    const firstName = user.profile?.firstName ?? '';
    const lastName = user.profile?.lastName ?? '';
    const fullName = [firstName, lastName].filter(Boolean).join(' ') || null;

    return {
      id: user.id,
      name: fullName,
      email: user.email,
      status: (user.accountDeletedAt
        ? 'deleted'
        : user.isSuspended
        ? 'suspended'
        : user.isActive
        ? 'active'
        : 'inactive') as SeekerStatus,
      totalJobs: user.totalJobs ?? 0,
      joinedAt: user.createdAt,
    };
  }
}
