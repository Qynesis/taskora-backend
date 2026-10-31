import { BadRequestException, Injectable, NotFoundException, ForbiddenException, UnprocessableEntityException, ConflictException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Job } from '../../database/entities/job.entity';
import { Review } from '../../database/entities/review.entity';
import { Profile } from '../../database/entities/profile.entity';
import { Bid } from '../../database/entities/bid.entity';
import { JobPhoto } from '../../database/entities/job-photo.entity';
import { JobContract } from '../../database/entities/job-contract.entity';
import { Payment } from '../../database/entities/payment.entity';
import { Refund } from '../../database/entities/refund.entity';
import { RefundRequest } from '../../database/entities/refund-request.entity';
import { RefundEvidencePhoto } from '../../database/entities/refund-evidence-photo.entity';
import { Subscription } from '../../database/entities/subscription.entity';
import { Transaction } from '../../database/entities/transaction.entity';
import { ProviderWorkInfo } from '../../database/entities/provider_work_info.entity';
import { Category } from '../../database/entities/category.entity';
import { PlatformFeeConfig } from '../../database/entities/platform-fee-config.entity';
import { StripeService } from '../stripe/stripe.service';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { JobQueryDto } from './dto/job-query.dto';
import { CreateJobContractDto } from './dto/create-job-contract.dto';
import { JobContractResponseDto } from './dto/job-contract-response.dto';
import { IdResponseDto } from '../../interfaces/id-response.dto';
import { PaginatedResponseDto } from '../../interfaces/paginated-response.dto';
import { TransactionHelper } from '../../database/transaction.helper';
import { DomainEventEmitter } from '../../events/domain-event-emitter.service';
import { JobCreatedEvent } from './events/job-created.event';
import { JobStatusChangedEvent } from './events/job-status-changed.event';
import { ProviderJobStatusDto, ProviderJobStatusTransition } from './dto/provider-job-status.dto';
import { CreateRefundRequestDto } from './dto/create-refund-request.dto';
import { MyServiceResponseDto } from './dto/my-service-response.dto';
import { JobDetailResponseDto, JOB_RAIL_STEPS, DIRECT_RAIL_STEPS, StatusRailStepDto, SelectedProviderSummaryDto, RefundDetailDto } from './dto/job-detail-response.dto';
import { JobFeedItemDto } from './dto/job-feed-item.dto';
import { SeekersJobQueryDto, SeekerRequestStatusFilter } from './dto/seekers-job-query.dto';
import { MyServicesQueryDto, MyServiceStatusFilter } from './dto/my-services-query.dto';
import { RequestedServiceResponseDto } from './dto/requested-service-response.dto';
import { RequestedServiceCountsDto } from './dto/requested-service-counts.dto';
import { MyServiceCountsDto } from './dto/my-service-counts.dto';
import { RequestedServicePaymentCountsDto } from './dto/requested-service-payment-counts.dto';
import { MyRequestPaymentQueryDto, SeekerPaymentStatusFilter } from './dto/my-request-payment-query.dto';
import { RequestedServicePaymentResponseDto } from './dto/requested-service-payment-response.dto';
import { JobStatus, JobType, ServiceDuration, EngagementType, SubscriptionStatus, PaymentStatus, RefundRequestStatus, RefundEvidenceSide, ServiceFrequency, BidStatus, TransactionType, SubscriptionCancellationStatus, BillingPeriod } from '../../database/common/enum';
import { JobRefundRequestedEvent } from './events/job-refund-requested.event';
import { RefundRejectedEvent } from './events/refund-rejected.event';
import { ProviderRefundRequestQueryDto } from './dto/provider-refund-request-query.dto';
import { ProviderRefundRequestListItemDto } from './dto/provider-refund-request-list-item.dto';
import { ProviderRefundRequestDetailDto } from './dto/provider-refund-request-detail.dto';
import { RejectRefundRequestDto } from './dto/reject-refund-request.dto';
import { money, toCents } from '../../interfaces/money.util';
import { CancelJobResponseDto } from './dto/cancel-job-response.dto';
import { Role } from '../../security/rbac/roles.enum';
import { AppCacheService } from '../../cache/cache.service';
import { jobViewPrefixes } from '../../cache/job-view-invalidation';

@Injectable()
export class JobService {
  private readonly logger = new Logger(JobService.name);

  constructor(
    @InjectRepository(Job)
    private readonly jobRepository: Repository<Job>,
    @InjectRepository(JobPhoto)
    private readonly jobPhotoRepository: Repository<JobPhoto>,
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    @InjectRepository(Refund)
    private readonly refundRepository: Repository<Refund>,
    @InjectRepository(RefundRequest)
    private readonly refundRequestRepository: Repository<RefundRequest>,
    @InjectRepository(RefundEvidencePhoto)
    private readonly refundEvidencePhotoRepository: Repository<RefundEvidencePhoto>,
    @InjectRepository(JobContract)
    private readonly contractRepository: Repository<JobContract>,
    @InjectRepository(Subscription)
    private readonly subscriptionRepository: Repository<Subscription>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    @InjectRepository(PlatformFeeConfig)
    private readonly feeConfigRepository: Repository<PlatformFeeConfig>,
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
    private readonly txHelper: TransactionHelper,
    private readonly eventEmitter: DomainEventEmitter,
    private readonly stripeService: StripeService,
    private readonly cacheService: AppCacheService,
  ) { }

  // Clears every seeker/provider job view for a job, used by service-layer flows where the
  // request-scoped @InvalidateCache interceptor can't run. Never throws.
  private async invalidateJobViews(jobId: string, seekerId: string): Promise<void> {
    try {
      await Promise.all(jobViewPrefixes(jobId, seekerId).map((p) => this.cacheService.delByPrefix(p)));
    } catch (err) {
      this.logger.error(`Failed to invalidate job views for job ${jobId}: ${(err as Error).message}`);
    }
  }

  private async generateJobRef(): Promise<string> {
    while (true) {
      const ref = `JOB-${Math.floor(100000 + Math.random() * 900000)}`;
      const exists = await this.jobRepository.findOne({ where: { jobRef: ref } as any });
      if (!exists) return ref;
    }
  }

  private mapRequestedServiceStatuses(status?: SeekerRequestStatusFilter): JobStatus[] | null {
    if (!status) {
      return null;
    }

    const normalized = status;

    if (normalized === SeekerRequestStatusFilter.REQUESTED) {
      return [JobStatus.POSTED];
    }

    if (normalized === SeekerRequestStatusFilter.BIDDING) {
      return [JobStatus.BIDDING];
    }

    if (normalized === SeekerRequestStatusFilter.IN_PROGRESS) {
      return [JobStatus.SELECTED, JobStatus.IN_PROGRESS];
    }

    if (normalized === SeekerRequestStatusFilter.COMPLETED) {
      return [JobStatus.COMPLETED];
    }

    if (normalized === SeekerRequestStatusFilter.CANCELLED) {
      // REJECTED is a DIRECT-flow state; these endpoints are bidding-only, so cancelled = CANCELLED.
      return [JobStatus.CANCELLED];
    }

    return null;
  }

  async countRequestedServices(seekerId: string): Promise<RequestedServiceCountsDto> {
    const rows = await this.jobRepository
      .createQueryBuilder('job')
      .select('job.status', 'status')
      .addSelect('COUNT(job.id)', 'count')
      .where('job.seeker_user_id = :seekerId', { seekerId })
      .andWhere('job.type = :jobType', { jobType: JobType.BIDDING })
      .groupBy('job.status')
      .getRawMany<{ status: JobStatus; count: string }>();

    const raw = new Map(rows.map((r) => [r.status, Number(r.count)]));
    const sum = (...statuses: JobStatus[]) => statuses.reduce((acc, s) => acc + (raw.get(s) ?? 0), 0);

    return {
      requested:   sum(JobStatus.POSTED),
      in_progress: sum(JobStatus.SELECTED, JobStatus.IN_PROGRESS),
      completed:   sum(JobStatus.COMPLETED),
      // REJECTED is a DIRECT-flow state; these endpoints are bidding-only, so cancelled = CANCELLED.
      cancelled:   sum(JobStatus.CANCELLED),
    };
  }

  async countMyServices(providerId: string): Promise<MyServiceCountsDto> {
    const rows = await this.jobRepository
      .createQueryBuilder('job')
      .select('job.status', 'status')
      .addSelect('COUNT(job.id)', 'count')
      .where('job.provider_user_id = :providerId', { providerId })
      .andWhere('job.type = :type', { type: JobType.BIDDING })
      .groupBy('job.status')
      .getRawMany<{ status: JobStatus; count: string }>();

    const raw = new Map(rows.map((r) => [r.status, Number(r.count)]));
    const sum = (...statuses: JobStatus[]) => statuses.reduce((acc, s) => acc + (raw.get(s) ?? 0), 0);

    return {
      to_do:       sum(JobStatus.SELECTED),
      in_progress: sum(JobStatus.IN_PROGRESS),
      completed:   sum(JobStatus.COMPLETED),
      cancelled:   sum(JobStatus.CANCELLED),
    };
  }

  /** For the given jobs, map jobId → effectiveAt for any subscription with a PENDING seeker cancellation
   *  request (the 14-day notice window), so list views can show a "cancellation scheduled" indicator. */
  private async getPendingCancellationEffectiveByJobIds(jobIds: string[]): Promise<Map<string, Date>> {
    const map = new Map<string, Date>();
    if (jobIds.length === 0) return map;

    const rows = await this.jobRepository.manager
      .createQueryBuilder()
      .select('s.job_id', 'jobId')
      .addSelect('scr.effective_at', 'effectiveAt')
      .from('subscription_cancellation_requests', 'scr')
      .innerJoin('subscriptions', 's', 's.id = scr.subscription_id')
      .where('scr.status = :status', { status: SubscriptionCancellationStatus.PENDING })
      .andWhere('s.job_id IN (:...jobIds)', { jobIds })
      .getRawMany<{ jobId: string; effectiveAt: Date }>();

    for (const r of rows) {
      map.set(r.jobId, r.effectiveAt);
    }
    return map;
  }

  async countRequestedServicePayments(seekerId: string): Promise<RequestedServicePaymentCountsDto> {
    const rows = await this.jobRepository
      .createQueryBuilder('job')
      .select('payment.status', 'paymentStatus')
      .addSelect('COUNT(job.id)', 'count')
      .leftJoin(
        (subQ) =>
          subQ
            .select('p.job_id', 'job_id')
            .addSelect('MAX(p.created_at)', 'max_created_at')
            .from(Payment, 'p')
            .where('p.seeker_user_id = :seekerId', { seekerId })
            .groupBy('p.job_id'),
        'latest_payment',
        'latest_payment.job_id = job.id',
      )
      .leftJoin(
        Payment,
        'payment',
        'payment.job_id = job.id AND payment.created_at = latest_payment.max_created_at AND payment.seeker_user_id = :seekerId',
        { seekerId },
      )
      .where('job.seeker_user_id = :seekerId', { seekerId })
      .andWhere('job.type = :type', { type: JobType.BIDDING })
      .andWhere(
        `(payment.status IS NULL OR payment.status <> :canceledStatus OR EXISTS (
          SELECT 1 FROM transactions t WHERE t.payment_id = payment.id AND t.type = :paymentTxnType
        ))`,
        { canceledStatus: PaymentStatus.CANCELED, paymentTxnType: TransactionType.PAYMENT },
      )
      .groupBy('payment.status')
      .getRawMany<{ paymentStatus: string | null; count: string }>();

    const raw = new Map(rows.map((r) => [r.paymentStatus, Number(r.count)]));
    const due = [null, 'pending', 'failed'].reduce((acc, s) => acc + (raw.get(s) ?? 0), 0);

    return {
      all:      rows.reduce((acc, r) => acc + Number(r.count), 0),
      paid:     raw.get('succeeded') ?? 0,
      due,
      refunded: raw.get('refunded') ?? 0,
    };
  }

  private mapPaymentPageStatuses(filter?: SeekerPaymentStatusFilter): {
    statuses: string[];
    includeNull: boolean;
  } {
    const normalized = filter ?? SeekerPaymentStatusFilter.ALL;

    if (normalized === SeekerPaymentStatusFilter.PAID) {
      return { statuses: ['succeeded'], includeNull: false };
    }

    if (normalized === SeekerPaymentStatusFilter.REFUNDED) {
      return { statuses: ['refunded'], includeNull: false };
    }

    if (normalized === SeekerPaymentStatusFilter.DUE) {
      // 'canceled' is terminal (paid-then-cancelled), not due — it surfaces only under the All tab.
      return { statuses: ['pending', 'failed'], includeNull: true };
    }

    return { statuses: [], includeNull: true };
  }

  private async getLatestPaymentStatusByJobIds(
    seekerId: string,
    jobIds: string[],
  ): Promise<Map<string, { status: string | null; invoiceUrl: string | null; isSubscription: boolean; paymentId: string | null }>> {
    const map = new Map<string, { status: string | null; invoiceUrl: string | null; isSubscription: boolean; paymentId: string | null }>();
    if (jobIds.length === 0) {
      return map;
    }

    const latest = await this.paymentRepository.manager
      .createQueryBuilder()
      .select('latest.job_id', 'jobId')
      .addSelect('p.status', 'status')
      .addSelect('p.hosted_invoice_url', 'invoiceUrl')
      .addSelect('p.is_subscription', 'isSubscription')
      .addSelect('p.id', 'paymentId')
      .from(
        (sub) =>
          sub
            .select('px.job_id', 'job_id')
            .addSelect('MAX(px.created_at)', 'max_created_at')
            .from('payments', 'px')
            .where('px.seeker_user_id = :seekerId', { seekerId })
            .andWhere('px.job_id IN (:...jobIds)', { jobIds })
            .groupBy('px.job_id'),
        'latest',
      )
      .leftJoin(
        'payments',
        'p',
        'p.job_id = latest.job_id AND p.created_at = latest.max_created_at AND p.seeker_user_id = :seekerId',
        { seekerId },
      )
      .getRawMany<{ jobId: string; status: string | null; invoiceUrl: string | null; isSubscription: boolean; paymentId: string | null }>();

    for (const row of latest) {
      map.set(row.jobId, {
        status: row.status ?? null,
        invoiceUrl: row.invoiceUrl ?? null,
        isSubscription: row.isSubscription ?? false,
        paymentId: row.paymentId ?? null,
      });
    }

    return map;
  }

  private async resolveRefundReason(paymentId: string): Promise<string | null> {
    const latestRequest = await this.refundRequestRepository.findOne({
      where: { payment: { id: paymentId } } as any,
      order: { createdAt: 'DESC' },
    });

    if (latestRequest?.reason) {
      return latestRequest.comments
        ? `${latestRequest.reason}: ${latestRequest.comments}`
        : `${latestRequest.reason}`;
    }

    const latestRefund = await this.refundRepository.findOne({
      where: { payment: { id: paymentId } } as any,
      order: { createdAt: 'DESC' },
    });

    return latestRefund?.reason ?? null;
  }

  /** Refund overlay for the job detail: the latest refund request (status/reason/comment/amount),
   *  independent of payment status so pending/rejected requests surface too. Null when none exists. */
  private async resolveRefundDetail(paymentId: string): Promise<RefundDetailDto | null> {
    const latestRequest = await this.refundRequestRepository.findOne({
      where: { payment: { id: paymentId } } as any,
      order: { createdAt: 'DESC' },
      relations: { evidencePhotos: true },
    });

    // No dispute request (e.g. a seeker cancellation refunds directly via the refunds ledger).
    // Fall back to the latest Refund row so a refunded payment always carries its details —
    // mirroring resolveRefundReason. Dispute-only fields (comment, attachments) are empty here.
    if (!latestRequest) {
      const latestRefund = await this.refundRepository.findOne({
        where: { payment: { id: paymentId } } as any,
        order: { createdAt: 'DESC' },
      });
      if (!latestRefund) return null;

      return {
        status: latestRefund.status === 'succeeded' ? RefundRequestStatus.APPROVED : RefundRequestStatus.PENDING,
        reason: latestRefund.reason ?? '',
        comment: null,
        amount: money(latestRefund.amount),
        attachments: [],
      };
    }

    const attachments = (latestRequest.evidencePhotos ?? [])
      .filter((p) => p.side === RefundEvidenceSide.SEEKER)
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((p) => p.fileUrl);

    return {
      status: latestRequest.status,
      reason: latestRequest.reason,
      comment: latestRequest.comments ?? null,
      amount: money(latestRequest.requestedAmount),
      attachments,
    };
  }

  async createRefundRequest(seekerId: string, dto: CreateRefundRequestDto): Promise<RefundRequest> {
    const job = await this.jobRepository.findOne({
      where: { id: dto.jobId } as any,
      relations: { seeker: true, provider: true },
    });

    if (!job) {
      throw new NotFoundException(`Job with id "${dto.jobId}" not found`);
    }
    if (job.seeker.id !== seekerId) {
      throw new ForbiddenException('You are not the seeker of this job');
    }

    // A refund can only be requested after the service is finished — the seeker raises it
    // when the completed work was unsatisfactory / caused inconvenience.
    if (job.status !== JobStatus.COMPLETED) {
      throw new BadRequestException('A refund can only be requested once the job is completed');
    }

    const payment = await this.paymentRepository.findOne({
      where: {
        job: { id: dto.jobId },
        seeker: { id: seekerId },
      } as any,
      relations: { provider: true },
      order: { createdAt: 'DESC' },
    });

    if (!payment) {
      throw new BadRequestException('No payment found for this job');
    }

    if (payment.status === PaymentStatus.REFUNDED) {
      throw new BadRequestException('This payment has already been refunded');
    }

    if (!payment.isSubscription) {
      // Single-task: Stripe collected the money in one shot, payment must be SUCCEEDED
      if (payment.status !== PaymentStatus.SUCCEEDED) {
        throw new BadRequestException('Refund request can only be submitted for a succeeded payment');
      }
    } else {
      // Subscription: payment stays PENDING across all cycles; require at least one paid cycle
      const paidCycleCount = await this.transactionRepository.count({
        where: { payment: { id: payment.id }, type: TransactionType.PAYMENT },
      });
      if (paidCycleCount === 0) {
        throw new BadRequestException('No payment cycles have been collected yet for this subscription');
      }
    }

    const existingPending = await this.refundRequestRepository.findOne({
      where: {
        payment: { id: payment.id },
        seeker: { id: seekerId },
        status: RefundRequestStatus.PENDING,
      } as any,
    });

    if (existingPending) {
      throw new BadRequestException('A refund request is already pending for this payment');
    }

    // For subscriptions: requestedAmount = sum of what was actually charged across all cycles,
    // not payment.amount (which is the total contract commitment set at selection time).
    let requestedAmount: number;
    if (payment.isSubscription) {
      const agg = await this.transactionRepository
        .createQueryBuilder('t')
        .select('COALESCE(SUM(t.amount), 0)::float', 'total')
        .where('t.payment_id = :paymentId', { paymentId: payment.id })
        .andWhere('t.type = :type', { type: TransactionType.PAYMENT })
        .getRawOne<{ total: string }>();
      requestedAmount = money(Number(agg?.total ?? 0));
    } else {
      requestedAmount = money(payment.amount);
    }

    const savedRequest = await this.txHelper.run<RefundRequest>(async (qr) => {
      const request = {
        job: { id: dto.jobId },
        payment: { id: payment.id },
        seeker: { id: seekerId },
        reason: dto.reason,
        comments: dto.comments ?? null,
        requestedAmount,
      };

      const saved = await qr.manager.save(RefundRequest, request as any);

      if (dto.evidenceUrls?.length) {
        const evidence = dto.evidenceUrls.map((fileUrl, index) =>
          ({
            refundRequest: { id: saved.id },
            fileUrl,
            side: RefundEvidenceSide.SEEKER,
            sortOrder: index,
          }),
        );
        await qr.manager.save(RefundEvidencePhoto, evidence as any[]);
      }

      return saved;
    });

    const providerId =
      payment.provider?.id
      ?? job.provider?.id
      ?? null;

    if (providerId) {
      this.eventEmitter.emit(
        new JobRefundRequestedEvent(
          savedRequest.id,
          dto.jobId,
          job.title ?? '',
          seekerId,
          providerId,
          dto.reason,
          dto.comments ?? null,
        ),
      );
    }

    return savedRequest;
  }

  async findRefundRequestsForProvider(
    providerId: string,
    query: ProviderRefundRequestQueryDto,
  ): Promise<PaginatedResponseDto<ProviderRefundRequestListItemDto>> {
    const base = this.refundRequestRepository
      .createQueryBuilder('rr')
      .innerJoin('rr.job', 'job')
      .innerJoin('rr.seeker', 'seeker')
      .leftJoin('seeker.profile', 'seekerProfile')
      .where(
        'job.provider_user_id = :providerId',
        { providerId },
      );

    if (query.status) {
      base.andWhere('rr.status = :status', { status: query.status });
    }

    const total = await base.getCount();

    const rawRows = await base
      .select('rr.id', 'id')
      .addSelect('job.title', 'jobTitle')
      .addSelect('seekerProfile.firstName', 'seekerFirstName')
      .addSelect('seekerProfile.lastName', 'seekerLastName')
      .addSelect('seeker.email', 'seekerEmail')
      .addSelect('rr.reason', 'reason')
      .addSelect('rr.requestedAmount', 'amount')
      .addSelect('rr.status', 'status')
      .addSelect('rr.createdAt', 'createdAt')
      .orderBy('rr.createdAt', query.order)
      .skip((query.page - 1) * query.limit)
      .take(query.limit)
      .getRawMany<Record<string, any>>();

    return new PaginatedResponseDto(
      rawRows.map(ProviderRefundRequestListItemDto.fromRaw),
      total,
      query.page,
      query.limit,
    );
  }

  async findRefundRequestDetailForProvider(
    id: string,
    providerId: string,
  ): Promise<ProviderRefundRequestDetailDto> {
    const rr = await this.refundRequestRepository.findOne({
      where: { id } as any,
      relations: {
        job: { category: true, provider: true },
        payment: true,
        seeker: { profile: true },
        evidencePhotos: true,
      },
    });

    if (!rr) {
      throw new NotFoundException(`Refund request with id "${id}" not found`);
    }

    const jobProviderId = rr.job.provider?.id ?? null;
    if (jobProviderId !== providerId) {
      throw new ForbiddenException('You do not have access to this refund request');
    }

    rr.evidencePhotos = rr.evidencePhotos.filter((p) => p.side === RefundEvidenceSide.SEEKER);

    return ProviderRefundRequestDetailDto.from(rr);
  }

  async rejectRefundRequest(
    id: string,
    providerId: string,
    dto: RejectRefundRequestDto,
  ): Promise<IdResponseDto> {
    const rr = await this.refundRequestRepository.findOne({
      where: { id } as any,
      relations: { job: { provider: true, seeker: true } },
    });

    if (!rr) {
      throw new NotFoundException(`Refund request with id "${id}" not found`);
    }

    const jobProviderId = rr.job.provider?.id ?? null;
    if (jobProviderId !== providerId) {
      throw new ForbiddenException('You do not have access to this refund request');
    }

    if (rr.status !== RefundRequestStatus.PENDING) {
      throw new BadRequestException(
        `Refund request cannot be rejected: current status is "${rr.status}"`,
      );
    }

    await this.txHelper.run(async (qr) => {
      await qr.manager.update(RefundRequest, id, {
        status: RefundRequestStatus.REJECTED,
        rejectionReason: dto.rejectionReason,
        reviewedAt: new Date(),
      });

      if (dto.attachmentUrls?.length) {
        const photos = dto.attachmentUrls.map((url, i) =>
          this.refundEvidencePhotoRepository.create({
            refundRequest: { id },
            fileUrl: url,
            side: RefundEvidenceSide.ADMIN,
            sortOrder: i,
          }),
        );
        await qr.manager.save(RefundEvidencePhoto, photos);
      }
    });

    this.eventEmitter.emit(
      new RefundRejectedEvent(id, rr.job.id, rr.job.title ?? '', (rr.job.seeker as any).id, providerId),
    );

    await this.invalidateJobViews(rr.job.id, (rr.job.seeker as any).id);

    return { id };
  }

  async create(dto: CreateJobDto, userId: string): Promise<Job> {
    const { photos, serviceDuration, categoryId, ...jobData } = dto;
    const jobRef = await this.generateJobRef();

    const hasProfile = await this.jobRepository.manager.existsBy(Profile, { user: { id: userId } } as any);
    if (!hasProfile) {
      throw new UnprocessableEntityException('Please complete your profile before posting a job');
    }

    if (categoryId) {
      const categoryExists = await this.categoryRepository.existsBy({ id: categoryId } as any);
      if (!categoryExists) {
        throw new BadRequestException('Invalid categoryId');
      }
    }

    if (serviceDuration === ServiceDuration.SINGLE_TASK) {
      if (dto.endDate) {
        throw new BadRequestException('endDate must be empty for single_task jobs');
      }
      if (dto.frequency) {
        throw new BadRequestException('frequency must be empty for single_task jobs');
      }
      if (dto.scheduledDays?.length) {
        throw new BadRequestException('scheduledDays must be empty for single_task jobs');
      }
      if (dto.totalHours != null || dto.totalHoursPeriod != null) {
        throw new BadRequestException('totalHours and totalHoursPeriod are not allowed for single_task jobs');
      }
      if (dto.budgetPeriod) {
        throw new BadRequestException('budgetPeriod is not allowed for single_task jobs');
      }
    }

    if (serviceDuration !== ServiceDuration.SINGLE_TASK) {
      if (!dto.endDate) {
        throw new BadRequestException('endDate is required for ongoing jobs');
      }
      if (!dto.frequency) {
        throw new BadRequestException('frequency is required for ongoing jobs');
      }
      if (dto.frequency === ServiceFrequency.CUSTOM && (!dto.scheduledDays || dto.scheduledDays.length === 0)) {
        throw new BadRequestException('scheduledDays is required when frequency is custom');
      }
      if (dto.frequency === ServiceFrequency.DAILY && dto.scheduledDays?.length) {
        throw new BadRequestException('scheduledDays must be empty when frequency is daily');
      }
    }

    // Derive backward-compat fields from serviceDuration
    const engagement =
      serviceDuration === ServiceDuration.SINGLE_TASK
        ? EngagementType.SINGLE
        : EngagementType.SHORT;
    const durationMonths: number | null = this.durationMonthsFor(serviceDuration);
    const totalBudget: number | null = this.computeTotalBudget(
      dto.budgetPrice,
      dto.budgetPeriod,
      serviceDuration,
      durationMonths,
    );

    const entity = await this.txHelper.run(async (qr) => {
      const record = this.jobRepository.create({
        ...jobData,
        serviceDuration,
        engagement,
        durationMonths,
        totalBudget,
        jobRef,
        seeker: { id: userId },
        ...(categoryId ? { category: { id: categoryId } } : {}),
      } as any) as unknown as Job;
      const savedJob = await qr.manager.save(record);

      if (photos?.length) {
        const photoEntities = photos.map((p) =>
          this.jobPhotoRepository.create({
            job: savedJob,
            fileUrl: p.fileUrl,
            sortOrder: p.sortOrder ?? 0,
          } as any),
        );
        await qr.manager.save(photoEntities);
      }

      return savedJob;
    });

    this.eventEmitter.emit(new JobCreatedEvent(entity.id, entity.title ?? ''));

    return entity;
  }

  async findAll(query: JobQueryDto): Promise<PaginatedResponseDto<JobFeedItemDto>> {
    const qb = this.jobRepository
      .createQueryBuilder('job')
      .leftJoinAndSelect('job.category', 'category')
      .where('job.type = :type', { type: JobType.BIDDING });

    if (query.search) {
      qb.andWhere(
        '(job.jobRef = :exact OR job.title ILIKE :partial)',
        { exact: query.search, partial: `%${query.search}%` },
      );
    }
    if (query.locationText) {
      qb.andWhere('job.locationText ILIKE :locationText', { locationText: `%${query.locationText}%` });
    }
    if (query.categoryId) {
      qb.andWhere('category.id = :categoryId', { categoryId: query.categoryId });
    }
    if (query.minPrice !== undefined) {
      qb.andWhere('job.budgetPrice >= :minPrice', { minPrice: query.minPrice });
    }
    if (query.maxPrice !== undefined) {
      qb.andWhere('job.budgetPrice <= :maxPrice', { maxPrice: query.maxPrice });
    }
    // Feed only shows open jobs — once selected/in-progress/completed they leave the feed
    qb.andWhere('job.status IN (:...feedStatuses)', {
      feedStatuses: [JobStatus.POSTED, JobStatus.BIDDING],
    });

    qb.orderBy(`job.${query.sortBy}`, query.order)
      .skip((query.page - 1) * query.limit)
      .take(query.limit);

    const [data, total] = await qb.getManyAndCount();
    return new PaginatedResponseDto(data.map(JobFeedItemDto.from), total, query.page, query.limit);
  }

  async findOne(id: string): Promise<Job> {
    const record = await this.jobRepository.findOneBy({ id, type: JobType.BIDDING } as any);
    if (!record) {
      throw new NotFoundException(`Job with id "${id}" not found`);
    }
    return record;
  }

  private static readonly PERIODS_PER_MONTH: Record<string, number> = { weekly: 4, fortnightly: 2, monthly: 1 };

  /** Months implied by a serviceDuration — null for single_task or when unset. */
  private durationMonthsFor(serviceDuration: ServiceDuration | null | undefined): number | null {
    return serviceDuration === ServiceDuration.ONE_MONTH
      ? 1
      : serviceDuration === ServiceDuration.THREE_MONTHS
        ? 3
        : serviceDuration === ServiceDuration.SIX_MONTHS
          ? 6
          : null;
  }

  /** Total contract value = rate × periods-per-month × months (just the budget price for a single_task
   *  or no-duration job). Shared by create and update so the two can't drift. */
  private computeTotalBudget(
    budgetPrice: number | null | undefined,
    budgetPeriod: BillingPeriod | null | undefined,
    serviceDuration: ServiceDuration | null | undefined,
    durationMonths: number | null,
  ): number | null {
    if (!budgetPrice) return null;
    if (!durationMonths || serviceDuration === ServiceDuration.SINGLE_TASK) return budgetPrice;
    const periods = budgetPeriod ? (JobService.PERIODS_PER_MONTH[budgetPeriod] ?? 1) : 1;
    return money(budgetPrice * periods * durationMonths);
  }

  async update(id: string, dto: UpdateJobDto, userId: string): Promise<Job> {
    const record = await this.jobRepository.findOne({
      where: { id, type: JobType.BIDDING } as any,
      relations: { seeker: true },
    });
    if (!record) throw new NotFoundException(`Job with id "${id}" not found`);
    if (record.seeker.id !== userId) throw new ForbiddenException('You do not own this job');

    const editableStatuses: JobStatus[] = [JobStatus.POSTED, JobStatus.BIDDING];
    if (!editableStatuses.includes(record.status)) {
      throw new ForbiddenException('Job cannot be edited after a bid has been accepted');
    }

    // Budget terms are only editable until the first bid lands: providers price their bids against
    // the posted budget, so it must not move under them. Before any bid, the seeker can still fix a
    // mistyped budget rather than having to cancel and re-post.
    if (dto.budgetPrice !== undefined || dto.budgetPeriod !== undefined) {
      const bidCount = await this.jobRepository.manager.count(Bid, { where: { job: { id } } as any });
      if (bidCount > 0) {
        throw new ForbiddenException('Budget cannot be changed once providers have placed bids');
      }
    }

    // photos and categoryId need separate handling: categoryId is a relation FK (not a mapped column),
    // so Object.assign would silently drop it — it must be set as a relation like create() does.
    const mutableDto = dto as UpdateJobDto & {
      photos?: { fileUrl: string; sortOrder?: number }[];
      serviceDuration?: ServiceDuration;
    };
    const { photos, serviceDuration, categoryId, ...fields } = mutableDto;

    if (categoryId !== undefined) {
      const categoryExists = await this.categoryRepository.existsBy({ id: categoryId } as any);
      if (!categoryExists) {
        throw new BadRequestException('Invalid categoryId');
      }
      (fields as any).category = { id: categoryId };
    }

    const nextServiceDuration = serviceDuration ?? record.serviceDuration;

    if (nextServiceDuration === ServiceDuration.SINGLE_TASK) {
      if (serviceDuration === ServiceDuration.SINGLE_TASK && !dto.startDate) {
        throw new BadRequestException('startDate is required when changing to single_task');
      }

      if (dto.endDate) {
        throw new BadRequestException('endDate must be empty for single_task jobs');
      }
      if (dto.frequency) {
        throw new BadRequestException('frequency must be empty for single_task jobs');
      }
      if (dto.scheduledDays?.length) {
        throw new BadRequestException('scheduledDays must be empty for single_task jobs');
      }
      if (dto.totalHours != null || dto.totalHoursPeriod != null) {
        throw new BadRequestException('totalHours and totalHoursPeriod are not allowed for single_task jobs');
      }

      (fields as any).endDate = null;
      (fields as any).frequency = null;
      (fields as any).scheduledDays = null;
      (fields as any).totalHours = null;
      (fields as any).totalHoursPeriod = null;

      if (dto.isFlexibleTime === true) {
        (fields as any).startTime = null;
        (fields as any).endTime = null;
      }
    }

    if (nextServiceDuration && nextServiceDuration !== ServiceDuration.SINGLE_TASK) {
      const nextEndDate = dto.endDate ?? record.endDate;
      if (!nextEndDate) {
        throw new BadRequestException('endDate is required for ongoing jobs');
      }

      const nextFrequency = dto.frequency ?? record.frequency;
      if (!nextFrequency) {
        throw new BadRequestException('frequency is required for ongoing jobs');
      }

      if (nextFrequency === ServiceFrequency.CUSTOM) {
        const nextDays = dto.scheduledDays ?? record.scheduledDays;
        if (!nextDays || nextDays.length === 0) {
          throw new BadRequestException('scheduledDays is required when frequency is custom');
        }
      }

      if (nextFrequency === ServiceFrequency.DAILY) {
        if (dto.scheduledDays?.length) {
          throw new BadRequestException('scheduledDays must be empty when frequency is daily');
        }
        (fields as any).scheduledDays = null;
      }
    }

    // Re-derive backward-compat fields whenever serviceDuration is explicitly updated
    if (serviceDuration !== undefined) {
      (fields as any).serviceDuration = serviceDuration;
      (fields as any).engagement =
        serviceDuration === ServiceDuration.SINGLE_TASK ? EngagementType.SINGLE : EngagementType.SHORT;
      (fields as any).durationMonths =
        serviceDuration === ServiceDuration.ONE_MONTH ? 1
          : serviceDuration === ServiceDuration.THREE_MONTHS ? 3
            : serviceDuration === ServiceDuration.SIX_MONTHS ? 6
              : null;
    }

    // totalBudget is derived (rate x periods x months), so it must be recomputed whenever any of its
    // inputs change — otherwise the stored total silently drifts from the budget terms.
    if (dto.budgetPrice !== undefined || dto.budgetPeriod !== undefined || serviceDuration !== undefined) {
      (fields as any).totalBudget = this.computeTotalBudget(
        dto.budgetPrice ?? record.budgetPrice,
        dto.budgetPeriod ?? record.budgetPeriod,
        nextServiceDuration,
        this.durationMonthsFor(nextServiceDuration),
      );
    }

    Object.assign(record, fields);
    const saved = await this.jobRepository.save(record);

    if (photos !== undefined) {
      await this.jobPhotoRepository
        .createQueryBuilder()
        .delete()
        .where('job_id = :id', { id })
        .execute();
      if (photos.length > 0) {
        await this.jobPhotoRepository.save(
          photos.map((p, i) =>
            this.jobPhotoRepository.create({
              job: saved,
              fileUrl: p.fileUrl,
              sortOrder: p.sortOrder ?? i,
            }),
          ),
        );
      }
    }

    return saved;
  }

  async updateStatus(id: string, providerId: string, dto: ProviderJobStatusDto): Promise<Job> {
    const record = await this.jobRepository.findOne({
      where: { id, type: JobType.BIDDING } as any,
      relations: { seeker: true, provider: true },
    });
    if (!record) throw new NotFoundException(`Job with id "${id}" not found`);

    if (record.provider?.id !== providerId) {
      throw new ForbiddenException('You are not the assigned provider for this job');
    }

    const allowedTransitions: Partial<Record<JobStatus, ProviderJobStatusTransition>> = {
      [JobStatus.SELECTED]:    ProviderJobStatusTransition.IN_PROGRESS,
      [JobStatus.IN_PROGRESS]: ProviderJobStatusTransition.COMPLETED,
    };

    if (allowedTransitions[record.status] !== dto.status) {
      throw new BadRequestException(
        `Cannot transition job from "${record.status}" to "${dto.status}"`,
      );
    }

    record.status = dto.status as unknown as JobStatus;
    const saved = await this.jobRepository.save(record);

    this.eventEmitter.emit(
      new JobStatusChangedEvent(saved.id, record.title ?? '', record.status, record.seeker.id, providerId, 'provider'),
    );

    return saved;
  }

  async findOneDetail(id: string, viewerId: string, viewerRoles: string[] = []): Promise<JobDetailResponseDto> {
    const job = await this.jobRepository.findOne({
      where: { id } as any,
      relations: [
        'seeker', 'seeker.profile',
        'category', 'photos',
        'provider', 'provider.profile',
        'selectedBid',
      ],
    });
    if (!job) throw new NotFoundException(`Job with id "${id}" not found`);

    
    const topBidRow = await this.jobRepository.manager
      .createQueryBuilder()
      .select('MIN(b.price)', 'topBidPrice')
      .from(Bid, 'b')
      .where('b.job_id = :id', { id })
      .getRawOne<{ topBidPrice: string | null }>();
    const topBidPrice = topBidRow?.topBidPrice != null ? money(topBidRow.topBidPrice) : null;
    const acceptedOfferPrice = job.selectedBid ? money(job.selectedBid.price) : null;

    // A subscription cancellation scheduled (14-day notice) but not yet effective — surfaced on the
    // status field as 'cancellation_awaiting', same as the list responses. Empty for non-subs.
    const cancellationPending = (await this.getPendingCancellationEffectiveByJobIds([id])).has(id);

    const isDirect = job.type === JobType.DIRECT;
    const isSeeker = job.seeker?.id === viewerId;
    const isProvider = job.provider?.id === viewerId;

    // ── Seeker view ────────────────────────────────────────────────────────────
    if (isSeeker) {
      const railSteps = isDirect ? DIRECT_RAIL_STEPS : JOB_RAIL_STEPS;
      // For BIDDING cancelled: reflect progress up to SELECTED if a provider was chosen
      const lastCompletedOnCancel =
        !isDirect && job.status === JobStatus.CANCELLED && job.provider
          ? JobStatus.SELECTED
          : null;
      const statusRail = this.buildStatusRail(job.status, railSteps, lastCompletedOnCancel);

      const providerUser = job.provider;
      let selectedProviderInfo: SelectedProviderSummaryDto | null = null;

      if (providerUser) {
        const providerId = providerUser.id;
        const providerProfile = providerUser.profile;
        const profileId = providerProfile?.id;

        const [workInfoRow, ratingRow] = await Promise.all([
          profileId
            ? this.jobRepository.manager
              .createQueryBuilder()
              .select('wi.businessName', 'businessName')
              .from(ProviderWorkInfo, 'wi')
              .where('wi.profile_id = :profileId', { profileId })
              .getRawOne<{ businessName: string | null }>()
            : Promise.resolve(null),
          this.jobRepository.manager
            .createQueryBuilder()
            .select('COALESCE(prs.average_rating, 0)', 'avgRating')
            .from('provider_rating_summaries', 'prs')
            .where('prs.provider_id = :providerId', { providerId })
            .getRawOne<{ avgRating: string }>(),
        ]);

        selectedProviderInfo = {
          businessName: workInfoRow?.businessName ?? null,
          avatarUrl: providerProfile?.avatarUrl ?? null,
          avgRating: Number(ratingRow?.avgRating ?? 0),
        };
      }

      const seekerPayment = await this.paymentRepository.findOne({
        where: { job: { id }, seeker: { id: viewerId } } as any,
        order: { createdAt: 'DESC' },
      });
      const seekerRefundReason =
        seekerPayment?.status === PaymentStatus.REFUNDED
          ? await this.resolveRefundReason(seekerPayment.id)
          : null;
      const seekerRefund = seekerPayment
        ? await this.resolveRefundDetail(seekerPayment.id)
        : null;

      // Reviews are one-per-job (unique jobId) and only the seeker writes them, so a matching row
      // means this seeker has already reviewed this service. Lets the UI toggle the review CTA.
      const hasReviewed =
        (await this.jobRepository.manager.count(Review, {
          where: { jobId: id, seekerId: viewerId } as any,
        })) > 0;

      const subRow = await this.jobRepository.manager
        .createQueryBuilder()
        .select('s.stripe_subscription_id', 'stripeId')
        .addSelect('s.status', 'status')
        .from('subscriptions', 's')
        .where('s.job_id = :id', { id })
        .getRawOne<{ stripeId: string | null; status: string }>();
      const subscriptionActive = !!subRow?.stripeId && subRow.status !== SubscriptionStatus.CANCELED;

      return JobDetailResponseDto.from(job, {
        statusRail,
        selectedProviderInfo,
        paymentStatus: seekerPayment?.status ?? null,
        refundReason: seekerRefundReason,
        refund: seekerRefund,
        topBidPrice,
        acceptedOfferPrice,
        cancellationPending,
        subscriptionActive,
        hasReviewed,
      });
    }

    // ── Provider view ──────────────────────────────────────────────────────────
    if (isProvider) {
      // DIRECT jobs have no winning bid price
      const selectedBidPrice = isDirect ? null : (job.selectedBid ? money(job.selectedBid.price) : null);
      const payment = await this.paymentRepository.findOne({
        where: { job: { id }, provider: { id: viewerId } } as any,
        order: { createdAt: 'DESC' },
      });
      const refundReason =
        payment?.status === PaymentStatus.REFUNDED
          ? await this.resolveRefundReason(payment.id)
          : null;
      const refund = payment ? await this.resolveRefundDetail(payment.id) : null;
      const myBid = job.selectedBid
        ? { id: job.selectedBid.id, price: money(job.selectedBid.price), status: BidStatus.ACCEPTED }
        : null;
      return JobDetailResponseDto.from(job, {
        selectedBidPrice,
        paymentStatus: payment?.status ?? null,
        refundReason,
        refund,
        myBid,
        topBidPrice,
        acceptedOfferPrice,
        isProvider: true,
        cancellationPending,
      });
    }

    // ── Any other viewer (browsing provider, admin, etc.) ─────────────────────
    if (viewerRoles.includes(Role.PROVIDER)) {
      const myBid = await this.jobRepository.manager.findOne(Bid, {
        where: { job: { id }, provider: { id: viewerId } } as any,
      });
      return JobDetailResponseDto.from(job, {
        myBid: myBid ? { id: myBid.id, price: money(myBid.price), status: myBid.status } : null,
        topBidPrice,
        acceptedOfferPrice,
        isProvider: true,
        cancellationPending,
      });
    }

    return JobDetailResponseDto.from(job, { topBidPrice, acceptedOfferPrice, cancellationPending });
  }

  /** Build the ordered status rail for the seeker view. `lastCompletedOnCancel` is the last step that
   *  genuinely completed before a CANCELLED/REJECTED terminal state (or null). */
  async getCancelPreview(
    jobId: string,
    seekerId: string,
  ): Promise<{ paidAmount: number; cancellationFee: number; cancellationFeePercent: number; lateCancellationHours: number; isLateCancellation: boolean; refundedAmount: number; currency: string }> {
    const job = await this.jobRepository.findOne({
      where: { id: jobId } as any,
      relations: ['seeker'],
    });
    if (!job) throw new NotFoundException(`Job "${jobId}" not found`);
    if (job.seeker.id !== seekerId) throw new ForbiddenException('You are not the seeker of this job');
    if (job.type !== JobType.BIDDING) throw new BadRequestException('Only bidding jobs support cancellation preview');
    const cancellableStatuses = [JobStatus.SELECTED, JobStatus.IN_PROGRESS];
    if (!cancellableStatuses.includes(job.status)) {
      throw new BadRequestException(`Job cannot be cancelled in its current status: "${job.status}"`);
    }

    // Single-task jobs only. Recurring subscription jobs are cancelled (with a 14-day notice
    // period) via POST /api/subscriptions/{id}/cancel.
    if (job.serviceDuration !== ServiceDuration.SINGLE_TASK) {
      throw new BadRequestException('Recurring subscription jobs use the subscription cancellation endpoint');
    }

    const [feeConfig] = await this.feeConfigRepository.find({ order: { createdAt: 'DESC' }, take: 1 });
    const cancellationFeePercent = money(feeConfig?.cancellationFeePercent ?? 10);
    const lateCancellationHours = feeConfig?.lateCancellationHours ?? 48;
    const currency = feeConfig?.currency ?? 'AUD';

    // Fee is a percentage of what the seeker actually paid, so the base amount must be known first.
    const payment = await this.paymentRepository.findOne({
      where: { job: { id: jobId }, status: PaymentStatus.SUCCEEDED } as any,
    });
    const paidAmount = money(payment?.amount ?? 0);
    const { fee: cancellationFee, isLateCancellation } = this.computeCancellationFee(
      job, cancellationFeePercent, lateCancellationHours, paidAmount,
    );
    const refundedAmount = money(Math.max(0, paidAmount - cancellationFee));

    return { paidAmount, cancellationFee, cancellationFeePercent, lateCancellationHours, isLateCancellation, refundedAmount, currency };
  }

  async cancelJobBySeeker(
    jobId: string,
    seekerId: string,
  ): Promise<CancelJobResponseDto> {
    const job = await this.jobRepository.findOne({
      where: { id: jobId } as any,
      relations: ['seeker', 'provider'],
    });
    if (!job) throw new NotFoundException(`Job "${jobId}" not found`);
    if (job.seeker.id !== seekerId) throw new ForbiddenException('You are not the seeker of this job');
    if (job.type !== JobType.BIDDING) throw new BadRequestException('Only bidding jobs can be cancelled via this endpoint');
    const cancellableStatuses = [JobStatus.SELECTED, JobStatus.IN_PROGRESS];
    if (!cancellableStatuses.includes(job.status)) {
      throw new BadRequestException(`Job cannot be cancelled in its current status: "${job.status}"`);
    }

    // Single-task jobs only. Recurring subscription jobs are cancelled (with a 14-day notice
    // period) via POST /api/subscriptions/{id}/cancel.
    if (job.serviceDuration !== ServiceDuration.SINGLE_TASK) {
      throw new BadRequestException('Recurring subscription jobs must be cancelled via the subscription cancellation endpoint');
    }

    const [feeConfig] = await this.feeConfigRepository.find({ order: { createdAt: 'DESC' }, take: 1 });
    const cancellationFeePercent = money(feeConfig?.cancellationFeePercent ?? 10);
    const lateCancellationHours = feeConfig?.lateCancellationHours ?? 48;
    const currency = feeConfig?.currency ?? 'AUD';

    // Only a SUCCEEDED payment is refundable (a prior refund leaves it REFUNDED and unmatched).
    const payment = await this.paymentRepository.findOne({
      where: { job: { id: jobId }, status: PaymentStatus.SUCCEEDED } as any,
    });

    // Fee is a percentage of the paid amount, so compute it from the payment (0 if nothing paid).
    const { fee: cancellationFee } = this.computeCancellationFee(
      job, cancellationFeePercent, lateCancellationHours, money(payment?.amount ?? 0),
    );

    // Compute + issue the refund (full amount minus the cancellation fee). Stripe calls happen
    // OUTSIDE the DB transaction, with a deterministic idempotency key so retries/concurrent
    // callers collapse to a single Stripe refund.
    let refundedAmount = 0;
    let stripeRefund: { id: string; status: string | null } | null = null;
    let refundChargeId: string | null = null;
    let creditNote: { id: string; pdfUrl: string | null } | null = null;

    if (payment) {
      const refundTxn = await this.transactionRepository.findOne({
        where: { payment: { id: payment.id }, type: TransactionType.PAYMENT },
        order: { createdAt: 'ASC' },
      });

      const candidate = money(Math.max(0, money(payment.amount ?? 0) - cancellationFee));
      const providerPayout = money(payment.amount ?? 0);

      if (refundTxn?.stripeChargeId) {
        refundChargeId = refundTxn.stripeChargeId;

        // Full clawback: on a cancelled job the provider is entitled to nothing, so reverse the
        // entire provider transfer back to the platform (not Stripe's default proportional reversal).
        if (providerPayout > 0) {
          await this.stripeService.reverseChargeTransfer(
            refundChargeId,
            toCents(providerPayout),
            `reverse:cancel:${refundChargeId}`,
          );
        }
      }

      if (refundTxn?.stripeChargeId && candidate > 0) {
        refundChargeId = refundTxn.stripeChargeId;
        // Refund the seeker job price − admin fee from the platform balance. reverseTransfer=false
        // because the transfer was already fully reversed above.
        stripeRefund = await this.stripeService.createRefund(
          refundChargeId,
          toCents(candidate),
          'seeker_cancellation',
          `refund:cancel:${refundChargeId}`,
          false,
        );
        refundedAmount = candidate;

        if (refundTxn.stripeInvoiceId) {
          try {
            const cn = await this.stripeService.createCreditNote(
              refundTxn.stripeInvoiceId,
              toCents(candidate),
              'seeker_cancellation',
              `cn:cancel:${refundChargeId}`,
            );
            creditNote = { id: cn.id, pdfUrl: (cn as any).pdf ?? null };
          } catch (err) {
            this.logger.warn(
              `Credit note skipped for cancel refund on job ${jobId}: ${(err as Error).message}`,
            );
          }
        }
      }
    }

    // 3) Persist atomically. The conditional status update is the concurrency guard:
    //    only one concurrent cancel flips SELECTED/IN_PROGRESS → CANCELLED and writes the
    //    refund row; a loser rolls back (its Stripe refund shared the idempotency key, so
    //    no extra money moved).
    await this.txHelper.run(async (qr) => {
      const claim = await qr.manager
        .createQueryBuilder()
        .update(Job)
        .set({ status: JobStatus.CANCELLED })
        .where('id = :jobId', { jobId })
        .andWhere('status IN (:...statuses)', { statuses: cancellableStatuses })
        .execute();

      if (!claim.affected) {
        throw new ConflictException('Job is already being cancelled');
      }

      if (payment && stripeRefund && refundChargeId) {
        await qr.manager.save(Refund, {
          payment: { id: payment.id },
          stripeRefundId: stripeRefund.id,
          stripeChargeId: refundChargeId,
          amount: refundedAmount,
          reason: 'seeker_cancellation',
          status: stripeRefund.status ?? 'succeeded',
          stripeCreditNoteId: creditNote?.id ?? null,
          creditNotePdfUrl: creditNote?.pdfUrl ?? null,
          applicationFeeRefunded: 0,
          transferReversedFee: 0,
        } as any);
        await qr.manager.update(Payment, payment.id, { status: PaymentStatus.REFUNDED });
      }

      // Cancelled before checkout — no SUCCEEDED payment to refund, but the contract-level Payment
      // created PENDING at selection time still lingers. Flip it to CANCELED so it isn't left as an
      // "open" payment (which would otherwise block account deletion). Mirrors the subscription path.
      const pendingPayment = await qr.manager.findOne(Payment, {
        where: { job: { id: jobId }, status: PaymentStatus.PENDING },
      });
      if (pendingPayment) {
        await qr.manager.save(Payment, { ...pendingPayment, status: PaymentStatus.CANCELED });
      }
    });

    this.eventEmitter.emit(
      new JobStatusChangedEvent(jobId, job.title ?? '', JobStatus.CANCELLED, seekerId, job.provider?.id ?? null, 'seeker'),
    );

    return { id: jobId, cancellationFee, refundedAmount, currency };
  }

  private computeCancellationFee(
    job: { createdAt?: Date | string | null },
    feePercent: number,
    coolingOffHours: number,
    baseAmount: number,
  ): { fee: number; isLateCancellation: boolean } {
    if (!job.createdAt) {
      // No booking timestamp — treat as within the cooling-off window (no fee) to avoid over-charging.
      return { fee: 0, isLateCancellation: false };
    }

    // Cooling-off measured from when the job was booked/paid. Cancelling within the first
    // `coolingOffHours` is free; after that a percentage admin fee applies to the paid amount.
    const bookedAt = new Date(job.createdAt).getTime();
    const hoursSinceBooking = (Date.now() - bookedAt) / (1000 * 60 * 60);
    const isLateCancellation = hoursSinceBooking > coolingOffHours;

    const fee = isLateCancellation ? money(baseAmount * (feePercent / 100)) : 0;
    return { fee, isLateCancellation };
  }

  private buildStatusRail(
    currentStatus: JobStatus,
    steps: JobStatus[],
    lastCompletedOnCancel: JobStatus | null = null,
  ): StatusRailStepDto[] {
    if (currentStatus === JobStatus.CANCELLED || currentStatus === JobStatus.REJECTED) {
      const lastIdx = lastCompletedOnCancel ? steps.indexOf(lastCompletedOnCancel) : -1;
      return steps.map((step, idx) => ({
        step,
        state: idx <= lastIdx ? 'completed' : 'upcoming',
      })) as StatusRailStepDto[];
    }
    const currentIdx = steps.indexOf(currentStatus);
    return steps.map((step, idx) => ({
      step,
      state: idx < currentIdx ? 'completed' : idx === currentIdx ? 'active' : 'upcoming',
    })) as StatusRailStepDto[];
  }

  async findRequestedServices(seekerId: string, query: SeekersJobQueryDto): Promise<PaginatedResponseDto<RequestedServiceResponseDto>> {
    const qb = this.jobRepository
      .createQueryBuilder('job')
      .leftJoinAndSelect('job.category', 'category')
      .leftJoinAndSelect('job.provider', 'provider')
      .leftJoinAndSelect('provider.profile', 'providerProfile')
      .where('job.seeker_user_id = :seekerId', { seekerId })
      .andWhere('job.type = :jobType', { jobType: JobType.BIDDING });

    if (query.search) {
      qb.andWhere('(job.jobRef = :search OR job.title ILIKE :searchTitle)', {
        search: query.search,
        searchTitle: `%${query.search}%`,
      });
    }
    const groupedStatuses = this.mapRequestedServiceStatuses(query.status);
    if (groupedStatuses && groupedStatuses.length > 0) {
      qb.andWhere('job.status IN (:...statuses)', { statuses: groupedStatuses });
    }
    if (query.locationText) {
      qb.andWhere('job.locationText ILIKE :locationText', { locationText: `%${query.locationText}%` });
    }
    if (query.categoryId) {
      qb.andWhere('category.id = :categoryId', { categoryId: query.categoryId });
    }

    qb.orderBy('job.createdAt', 'DESC')
      .skip((query.page - 1) * query.limit)
      .take(query.limit);

    const [jobs, total] = await qb.getManyAndCount();

    // Fetch bid stats (count + lowest price) for the loaded jobs in one query
    const statsMap = new Map<string, { bidCount: number; topBidPrice: number | null }>();
    if (jobs.length > 0) {
      const jobIds = jobs.map((j) => j.id);
      const rawStats = await this.jobRepository.manager
        .createQueryBuilder()
        .select('b.job_id', 'jobId')
        .addSelect('COUNT(b.id)', 'bidCount')
        .addSelect('MIN(b.price)', 'topBidPrice')
        .from(Bid, 'b')
        .where('b.job_id IN (:...jobIds)', { jobIds })
        .andWhere('b.status != :declined', { declined: BidStatus.DECLINED })
        .groupBy('b.job_id')
        .getRawMany<{ jobId: string; bidCount: string; topBidPrice: string | null }>();

      for (const s of rawStats) {
        statsMap.set(s.jobId, {
          bidCount: Number(s.bidCount),
          topBidPrice: s.topBidPrice !== null ? money(s.topBidPrice) : null,
        });
      }
    }

    const providerIds = Array.from(
      new Set(
        jobs
          .map((j) => j.provider?.id)
          .filter((id): id is string => Boolean(id)),
      ),
    );

    const providerProfileIds = Array.from(
      new Set(
        jobs
          .map((j: any) => j.provider?.profile?.id)
          .filter((id): id is string => Boolean(id)),
      ),
    );

    const providerBusinessNameByProfileId = new Map<string, string | null>();
    if (providerProfileIds.length > 0) {
      const rawBusiness = await this.jobRepository.manager
        .createQueryBuilder()
        .select('wi.profile_id', 'profileId')
        .addSelect('wi.business_name', 'businessName')
        .from('provider_work_info', 'wi')
        .where('wi.profile_id IN (:...profileIds)', { profileIds: providerProfileIds })
        .getRawMany<{ profileId: string; businessName: string | null }>();

      for (const row of rawBusiness) {
        providerBusinessNameByProfileId.set(row.profileId, row.businessName ?? null);
      }
    }

    const providerAvgRatingByProviderId = new Map<string, number>();
    if (providerIds.length > 0) {
      const rawRatings = await this.jobRepository.manager
        .createQueryBuilder()
        .select('prs.provider_id', 'providerId')
        .addSelect('COALESCE(prs.average_rating, 0)', 'avgRating')
        .from('provider_rating_summaries', 'prs')
        .where('prs.provider_id IN (:...providerIds)', { providerIds })
        .getRawMany<{ providerId: string; avgRating: string }>();

      for (const row of rawRatings) {
        providerAvgRatingByProviderId.set(row.providerId, Number(row.avgRating ?? 0));
      }
    }

    const providerCategoriesByProfileId = new Map<string, string[]>();
    if (providerProfileIds.length > 0) {
      const rawCategories = await this.jobRepository.manager
        .createQueryBuilder()
        .select('pc.profile_id', 'profileId')
        .addSelect('c.name', 'categoryName')
        .from('provider_categories', 'pc')
        .innerJoin('categories', 'c', 'c.id = pc.category_id')
        .where('pc.profile_id IN (:...profileIds)', { profileIds: providerProfileIds })
        .orderBy('c.name', 'ASC')
        .getRawMany<{ profileId: string; categoryName: string }>();

      for (const row of rawCategories) {
        const existing = providerCategoriesByProfileId.get(row.profileId) ?? [];
        existing.push(row.categoryName);
        providerCategoriesByProfileId.set(row.profileId, existing);
      }
    }

    const cancellationMap = await this.getPendingCancellationEffectiveByJobIds(jobs.map((j) => j.id));

    // One-per-job reviews written by this seeker — used to toggle the review CTA per list item.
    const reviewedJobIds = new Set<string>();
    if (jobs.length > 0) {
      const reviewedRows = await this.jobRepository.manager.find(Review, {
        where: { jobId: In(jobs.map((j) => j.id)), seekerId } as any,
        select: ['jobId'],
      });
      reviewedRows.forEach((r) => reviewedJobIds.add(r.jobId));
    }

    const enrichedData = jobs.map((job) => {
      const stats = statsMap.get(job.id) ?? { bidCount: 0, topBidPrice: null };
      const profileId = (job as any).provider?.profile?.id;

      const selectedProviderInfo = job.provider
        ? {
            businessName: providerBusinessNameByProfileId.get(profileId) ?? null,
            avatarUrl: (job as any).provider?.profile?.avatarUrl ?? null,
            avgRating: providerAvgRatingByProviderId.get(job.provider.id) ?? 0,
            categoryNames: providerCategoriesByProfileId.get(profileId) ?? [],
          }
        : null;

      return RequestedServiceResponseDto.from(
        job,
        stats.bidCount,
        stats.topBidPrice,
        selectedProviderInfo,
        cancellationMap.get(job.id) ?? null,
        reviewedJobIds.has(job.id),
      );
    });

    return new PaginatedResponseDto(enrichedData, total, query.page, query.limit);
  }

  async findRequestedServicePayments(
    seekerId: string,
    query: MyRequestPaymentQueryDto,
  ): Promise<PaginatedResponseDto<RequestedServicePaymentResponseDto>> {
    const qb = this.jobRepository
      .createQueryBuilder('job')
      .leftJoinAndSelect('job.category', 'category')
      .leftJoinAndSelect('job.selectedBid', 'selectedBid')
      .leftJoinAndSelect('job.provider', 'provider')
      .leftJoinAndSelect('provider.profile', 'providerProfile')
      .leftJoin(
        (subQ) =>
          subQ
            .select('p.job_id', 'job_id')
            .addSelect('MAX(p.created_at)', 'max_created_at')
            .from(Payment, 'p')
            .where('p.seeker_user_id = :seekerId', { seekerId })
            .groupBy('p.job_id'),
        'latest_payment',
        'latest_payment.job_id = job.id',
      )
      .leftJoin(
        Payment,
        'payment',
        'payment.job_id = job.id AND payment.created_at = latest_payment.max_created_at AND payment.seeker_user_id = :seekerId',
        { seekerId },
      )
      .where('job.seeker_user_id = :seekerId', { seekerId })
      .andWhere('job.type = :type', { type: JobType.BIDDING })
      .andWhere('payment.id IS NOT NULL')
      .andWhere(
        `(payment.status IS NULL OR payment.status <> :canceledStatus OR EXISTS (
          SELECT 1 FROM transactions t WHERE t.payment_id = payment.id AND t.type = :paymentTxnType
        ))`,
        { canceledStatus: PaymentStatus.CANCELED, paymentTxnType: TransactionType.PAYMENT },
      );

    if (query.search) {
      qb.andWhere('(job.jobRef = :search OR job.title ILIKE :searchTitle)', {
        search: query.search,
        searchTitle: `%${query.search}%`,
      });
    }

    const groupedStatuses = this.mapRequestedServiceStatuses(query.status);
    if (groupedStatuses && groupedStatuses.length > 0) {
      qb.andWhere('job.status IN (:...statuses)', { statuses: groupedStatuses });
    }

    if (query.locationText) {
      qb.andWhere('job.locationText ILIKE :locationText', { locationText: `%${query.locationText}%` });
    }

    if (query.categoryId) {
      qb.andWhere('category.id = :categoryId', { categoryId: query.categoryId });
    }

    const paymentMap = this.mapPaymentPageStatuses(query.paymentStatus);
    if (paymentMap.statuses.length > 0 && paymentMap.includeNull) {
      qb.andWhere('(payment.status IN (:...paymentStatuses) OR payment.id IS NULL)', {
        paymentStatuses: paymentMap.statuses,
      });
    } else if (paymentMap.statuses.length > 0) {
      qb.andWhere('payment.status IN (:...paymentStatuses)', { paymentStatuses: paymentMap.statuses });
    }

    qb.orderBy(`job.${query.sortBy}`, query.order)
      .skip((query.page - 1) * query.limit)
      .take(query.limit);

    const [jobs, total] = await qb.getManyAndCount();

    const statsMap = new Map<string, { bidCount: number; topBidPrice: number | null }>();
    if (jobs.length > 0) {
      const jobIds = jobs.map((j) => j.id);
      const rawStats = await this.jobRepository.manager
        .createQueryBuilder()
        .select('b.job_id', 'jobId')
        .addSelect('COUNT(b.id)', 'bidCount')
        .addSelect('MIN(b.price)', 'topBidPrice')
        .from(Bid, 'b')
        .where('b.job_id IN (:...jobIds)', { jobIds })
        .andWhere('b.status != :declined', { declined: BidStatus.DECLINED })
        .groupBy('b.job_id')
        .getRawMany<{ jobId: string; bidCount: string; topBidPrice: string | null }>();

      for (const s of rawStats) {
        statsMap.set(s.jobId, {
          bidCount: Number(s.bidCount),
          topBidPrice: s.topBidPrice !== null ? money(s.topBidPrice) : null,
        });
      }

      const paymentStatusByJobId = await this.getLatestPaymentStatusByJobIds(seekerId, jobIds);

      // For subscription payments not yet succeeded, check if at least one PAYMENT transaction exists
      const subscriptionPaymentIds = Array.from(paymentStatusByJobId.values())
        .filter((p) => p.isSubscription && p.status !== PaymentStatus.SUCCEEDED && p.paymentId)
        .map((p) => p.paymentId as string);

      const paymentIdsWithTxn = new Set<string>();
      if (subscriptionPaymentIds.length > 0) {
        const txnRows = await this.transactionRepository
          .createQueryBuilder('t')
          .select('t.payment_id', 'paymentId')
          .where('t.payment_id IN (:...ids)', { ids: subscriptionPaymentIds })
          .andWhere('t.stripe_charge_id IS NOT NULL')
          .distinct(true)
          .getRawMany<{ paymentId: string }>();
        for (const row of txnRows) {
          paymentIdsWithTxn.add(row.paymentId);
        }
      }

      const providerIds = Array.from(
        new Set(
          jobs
            .map((j) => j.provider?.id)
            .filter((id): id is string => Boolean(id)),
        ),
      );

      const providerProfileIds = Array.from(
        new Set(
          jobs
            .map((j: any) => j.provider?.profile?.id)
            .filter((id): id is string => Boolean(id)),
        ),
      );

      const providerBusinessNameByProfileId = new Map<string, string | null>();
      if (providerProfileIds.length > 0) {
        const rawBusiness = await this.jobRepository.manager
          .createQueryBuilder()
          .select('wi.profile_id', 'profileId')
          .addSelect('wi.business_name', 'businessName')
          .from('provider_work_info', 'wi')
          .where('wi.profile_id IN (:...profileIds)', { profileIds: providerProfileIds })
          .getRawMany<{ profileId: string; businessName: string | null }>();

        for (const row of rawBusiness) {
          providerBusinessNameByProfileId.set(row.profileId, row.businessName ?? null);
        }
      }

      const providerAvgRatingByProviderId = new Map<string, number>();
      if (providerIds.length > 0) {
        const rawRatings = await this.jobRepository.manager
          .createQueryBuilder()
          .select('prs.provider_id', 'providerId')
          .addSelect('COALESCE(prs.average_rating, 0)', 'avgRating')
          .from('provider_rating_summaries', 'prs')
          .where('prs.provider_id IN (:...providerIds)', { providerIds })
          .getRawMany<{ providerId: string; avgRating: string }>();

        for (const row of rawRatings) {
          providerAvgRatingByProviderId.set(row.providerId, Number(row.avgRating ?? 0));
        }
      }

      const providerCategoriesByProfileId = new Map<string, string[]>();
      if (providerProfileIds.length > 0) {
        const rawCategories = await this.jobRepository.manager
          .createQueryBuilder()
          .select('pc.profile_id', 'profileId')
          .addSelect('c.name', 'categoryName')
          .from('provider_categories', 'pc')
          .innerJoin('categories', 'c', 'c.id = pc.category_id')
          .where('pc.profile_id IN (:...profileIds)', { profileIds: providerProfileIds })
          .orderBy('c.name', 'ASC')
          .getRawMany<{ profileId: string; categoryName: string }>();

        for (const row of rawCategories) {
          const existing = providerCategoriesByProfileId.get(row.profileId) ?? [];
          existing.push(row.categoryName);
          providerCategoriesByProfileId.set(row.profileId, existing);
        }
      }

      const cancellationMap = await this.getPendingCancellationEffectiveByJobIds(jobs.map((j) => j.id));

      // Which of these jobs already have a contract (long-term only). One query for the page.
      const contractJobIds = new Set<string>();
      const jobIdsForContracts = jobs.map((j) => j.id);
      if (jobIdsForContracts.length > 0) {
        const contractRows = await this.jobRepository.manager
          .createQueryBuilder()
          .select('jc.job_id', 'jobId')
          .from('job_contracts', 'jc')
          .where('jc.job_id IN (:...jobIds)', { jobIds: jobIdsForContracts })
          .getRawMany<{ jobId: string }>();
        for (const row of contractRows) contractJobIds.add(row.jobId);
      }

      const data = jobs.map((job) => {
        const stats = statsMap.get(job.id) ?? { bidCount: 0, topBidPrice: null };
        const payment = paymentStatusByJobId.get(job.id) ?? { status: null, invoiceUrl: null, isSubscription: false, paymentId: null };
        const profileId = (job as any).provider?.profile?.id;

        const selectedProviderInfo = job.provider
          ? {
            businessName: providerBusinessNameByProfileId.get(profileId) ?? null,
            avgRating: providerAvgRatingByProviderId.get(job.provider.id) ?? 0,
            avatarUrl: (job as any).provider?.profile?.avatarUrl ?? null,
            categoryNames: providerCategoriesByProfileId.get(profileId) ?? [],
          }
          : null;

        const hasTxn = payment.paymentId ? paymentIdsWithTxn.has(payment.paymentId) : false;

        return RequestedServicePaymentResponseDto.from(
          job,
          stats.bidCount,
          payment.status as any,
          payment.isSubscription,
          hasTxn,
          payment.status === PaymentStatus.SUCCEEDED ? payment.invoiceUrl : null,
          selectedProviderInfo,
          cancellationMap.get(job.id) ?? null,
          contractJobIds.has(job.id),
        );
      });

      return new PaginatedResponseDto(data, total, query.page, query.limit);
    }

    return new PaginatedResponseDto([], total, query.page, query.limit);
  }

  async createContract(jobId: string, seekerId: string, dto: CreateJobContractDto): Promise<JobContractResponseDto> {
    const job = await this.jobRepository.findOne({
      where: { id: jobId } as any,
      relations: { seeker: true, provider: true },
    });
    if (!job) throw new NotFoundException(`Job with id "${jobId}" not found`);
    if (job.seeker.id !== seekerId) throw new ForbiddenException('Only the job seeker can set contract terms');
    if (job.status !== JobStatus.SELECTED) {
      throw new BadRequestException('Contract terms can only be set after a provider has been selected');
    }
    if (job.serviceDuration === ServiceDuration.SINGLE_TASK) {
      throw new BadRequestException('Single-task jobs do not require a contract agreement');
    }

    const existing = await this.contractRepository.findOne({ where: { job: { id: jobId } } as any });
    if (existing) throw new BadRequestException('Contract terms have already been submitted for this job');

    const contract = this.contractRepository.create({
      job: { id: jobId },
      depositAmount: dto.depositAmount ?? null,
      paymentFrequency: dto.paymentFrequency,
      earlyTermination: dto.earlyTermination,
      confidentialityClause: dto.confidentialityClause,
      additionalClause: dto.additionalClause ?? null,
    } as any);

    const saved = await this.contractRepository.save(contract);

    // Create a Subscription(INCOMPLETE) placeholder so the checkout flow has a
    // record to attach the Stripe subscription ID to once payment is initiated.
    const subscription = this.subscriptionRepository.create({
      job: { id: jobId },
      seeker: { id: job.seeker.id },
      provider: { id: job.provider!.id },
      status: SubscriptionStatus.INCOMPLETE,
    } as any);
    await this.subscriptionRepository.save(subscription);

    return JobContractResponseDto.from({ ...saved, job } as any);
  }

  async findContract(jobId: string, userId: string): Promise<JobContractResponseDto> {
    const job = await this.jobRepository.findOne({
      where: { id: jobId } as any,
      relations: { seeker: true, provider: true },
    });
    if (!job) throw new NotFoundException(`Job with id "${jobId}" not found`);

    const isParticipant =
      job.seeker?.id === userId ||
      job.provider?.id === userId;
    if (!isParticipant) throw new ForbiddenException('Access denied');

    const contract = await this.contractRepository.findOne({ where: { job: { id: jobId } } as any });
    if (!contract) throw new NotFoundException('No contract terms found for this job');

    return JobContractResponseDto.from({ ...contract, job } as any);
  }

  async findMyServices(providerId: string, query: MyServicesQueryDto): Promise<PaginatedResponseDto<MyServiceResponseDto>> {
    const statusMap: Record<MyServiceStatusFilter, JobStatus> = {
      [MyServiceStatusFilter.TO_DO]:       JobStatus.SELECTED,
      [MyServiceStatusFilter.IN_PROGRESS]: JobStatus.IN_PROGRESS,
      [MyServiceStatusFilter.COMPLETED]:   JobStatus.COMPLETED,
      [MyServiceStatusFilter.CANCELLED]:   JobStatus.CANCELLED,
    };

    const qb = this.jobRepository
      .createQueryBuilder('job')
      .leftJoinAndSelect('job.selectedBid', 'selectedBid')
      .leftJoinAndSelect('job.category', 'category')
      .where('job.provider_user_id = :providerId', { providerId })
      // My Services is the bid-based job workspace; DIRECT bookings have their own /bookings
      // endpoints and lack a selectedBid/selectedAt, so exclude them here.
      .andWhere('job.type = :type', { type: JobType.BIDDING })
      .andWhere('job.status = :status', { status: statusMap[query.status] });

    if (query.search) {
      qb.andWhere('(job.jobRef = :search OR job.title ILIKE :searchTitle)', {
        search: query.search,
        searchTitle: `%${query.search}%`,
      });
    }
    if (query.year !== undefined) {
      qb.andWhere('EXTRACT(YEAR FROM job.selected_at) = :year', { year: query.year });
    }
    if (query.month !== undefined) {
      qb.andWhere('EXTRACT(MONTH FROM job.selected_at) = :month', { month: query.month });
    }
    if (query.categoryId) {
      qb.andWhere('category.id = :categoryId', { categoryId: query.categoryId });
    }
    if (query.locationText) {
      qb.andWhere('job.locationText ILIKE :locationText', { locationText: `%${query.locationText}%` });
    }
    // Bounds are against total_budget — the whole contract value — not budget_price, which is
    // the per-period rate on an ongoing job. Both bounds are inclusive.
    if (query.minPrice !== undefined) {
      qb.andWhere('job.totalBudget >= :minPrice', { minPrice: query.minPrice });
    }
    if (query.maxPrice !== undefined) {
      qb.andWhere('job.totalBudget <= :maxPrice', { maxPrice: query.maxPrice });
    }

    qb.orderBy(`job.${query.sortBy}`, query.order)
      .skip((query.page - 1) * query.limit)
      .take(query.limit);

    const [data, total] = await qb.getManyAndCount();
    const cancellationMap = await this.getPendingCancellationEffectiveByJobIds(data.map((j) => j.id));
    return new PaginatedResponseDto(
      data.map((job) => MyServiceResponseDto.from(job, cancellationMap.get(job.id) ?? null)),
      total,
      query.page,
      query.limit,
    );
  }

  async deleteJob(id: string, seekerId: string): Promise<void> {
    const job = await this.jobRepository.findOne({
      where: { id } as any,
      relations: { seeker: true },
    });
    if (!job) throw new NotFoundException(`Job "${id}" not found`);
    if (job.seeker.id !== seekerId) throw new ForbiddenException('You are not the seeker of this job');

    const deletableStatuses: JobStatus[] = [JobStatus.POSTED, JobStatus.PENDING];
    if (!deletableStatuses.includes(job.status)) {
      throw new BadRequestException(
        `Job can only be deleted when it is in Posted or Pending status (current: ${job.status})`,
      );
    }

    await this.jobRepository.remove(job);
  }
}
