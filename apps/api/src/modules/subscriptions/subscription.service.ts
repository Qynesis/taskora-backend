import { BadRequestException, Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TransactionHelper } from '../../database/transaction.helper';
import { StripeService } from '../stripe/stripe.service';
import { PlatformFeeService } from '../platform-fee/platform-fee.service';
import { StripeCustomer, Selection, StripeAccount, AuditLog, Job, JobContract, Transaction } from '../../database';
import { Subscription } from '../../database/entities/subscription.entity';
import { SubscriptionCancellationRequest } from '../../database/entities/subscription-cancellation-request.entity';
import { CancelSubscriptionDto } from './dto/cancel-subscription.dto';
import { SelectionCheckoutSessionResponseDto } from './dto/selection-checkout-session-response.dto';
import { SubscriptionCancellationResponseDto } from './dto/subscription-response.dto';
import { SubscriptionMappingRecord } from './interfaces/subscription-checkout.interface';
import { getFrequencyLabel, getNumberOfPeriods, getStripeInterval } from './helpers/amount.helper';
import { money, toCents } from '../../interfaces/money.util';
import { AppCacheService } from '../../cache/cache.service';
import { jobViewPrefixes } from '../../cache/job-view-invalidation';
import {
  ServiceDuration,
  JobStatus,
  TransactionType,
  SubscriptionStatus,
  SubscriptionCancellationReason,
  SubscriptionCancellationStatus,
} from '../../database/common/enum';

@Injectable()
export class SubscriptionService {
  private readonly logger = new Logger(SubscriptionService.name);

  constructor(
    @InjectRepository(Subscription) private readonly subscriptionRepository: Repository<Subscription>,
    @InjectRepository(StripeCustomer) private readonly stripeCustomerRepository: Repository<StripeCustomer>,
    @InjectRepository(Selection) private readonly selectionRepository: Repository<Selection>,
    @InjectRepository(StripeAccount) private readonly stripeAccountRepository: Repository<StripeAccount>,
    @InjectRepository(AuditLog) private readonly auditLogRepository: Repository<AuditLog>,
    @InjectRepository(Job) private readonly jobRepository: Repository<Job>,
    @InjectRepository(JobContract) private readonly jobContractRepository: Repository<JobContract>,
    @InjectRepository(Transaction) private readonly transactionRepository: Repository<Transaction>,
    @InjectRepository(SubscriptionCancellationRequest)
    private readonly cancellationRequestRepository: Repository<SubscriptionCancellationRequest>,

    private readonly txHelper: TransactionHelper,
    private readonly stripeService: StripeService,
    private readonly platformFeeService: PlatformFeeService,
    private readonly cacheService: AppCacheService,
  ) {}

  private async invalidateJobViews(jobId: string, seekerId: string): Promise<void> {
    try {
      await Promise.all(jobViewPrefixes(jobId, seekerId).map((p) => this.cacheService.delByPrefix(p)));
    } catch (err) {
      this.logger.error(`Failed to invalidate job views for job ${jobId}: ${(err as Error).message}`);
    }
  }

  // Resolve the subscription for a job with an ownership check. Keyed on the job id because
  // no client-facing API exposes the Stripe subscription id; @Unique(['job']) guarantees one match.
  private async resolveSubscriptionForJob(
    jobId: string,
    userId: string,
    roles: string[],
  ): Promise<Subscription> {
    const isAdmin = roles.some((role) => role.toUpperCase() === 'ADMIN');

    const subscription = await this.subscriptionRepository.findOne({
      where: (isAdmin
        ? { job: { id: jobId } }
        : [
            { job: { id: jobId }, seeker: { id: userId } },
            { job: { id: jobId }, provider: { id: userId } },
          ]) as any,
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }
    return subscription;
  }

  /** Initiate a subscription checkout for a long-term job: selectedBid.price is the periodic amount and
   *  durationMonths the cycle count, with deposit/frequency from JobContract. Auto-cancels once all
   *  cycles are paid. */
  async initiateJobSubscriptionCheckout(
    jobId: string,
    seekerId: string,
  ): Promise<SelectionCheckoutSessionResponseDto> {
    try {
      // 1. Load job with all required relations
      const job = await this.jobRepository.findOne({
        where: { id: jobId },
        relations: ['seeker', 'selectedBid', 'provider'],
      });

      if (!job) throw new NotFoundException(`Job ${jobId} not found`);
      if (job.seeker.id !== seekerId) throw new BadRequestException('Job does not belong to this seeker');
      if (!job.selectedBid) throw new BadRequestException('No bid has been selected for this job yet');
      if (!job.provider) throw new BadRequestException('No provider has been selected for this job yet');
      if (!job.durationMonths) throw new BadRequestException('Job does not have a subscription duration configured');

      // 2. Load job contract (contains deposit and payment frequency config)
      const contract = await this.jobContractRepository.findOne({
        where: { job: { id: jobId } },
      });

      if (!contract) {
        throw new BadRequestException('Job contract not found. A contract must be created before initiating payment.');
      }

      // 3. Compute billing breakdown from bid price, contract deposit and payment frequency
      const totalAmount = money(job.selectedBid.price); // total contract value in dollars
      if (!totalAmount || totalAmount <= 0) {
        throw new BadRequestException(`Invalid bid amount: ${job.selectedBid.price}`);
      }

      const numberOfPeriods = getNumberOfPeriods(contract.paymentFrequency, job.durationMonths);
      const installmentAmount = money(totalAmount / numberOfPeriods); // dollars per cycle

      const installmentAmountCents = toCents(installmentAmount);
      const stripeInterval = getStripeInterval(contract.paymentFrequency);

      // 4. Resolve selection (1:1 with job — needed for webhook mapping)
      const selection = await this.selectionRepository.findOne({
        where: { job: { id: jobId } },
      });

      if (!selection) throw new BadRequestException('Selection not found for this job');

      // 5. Get provider's Stripe account
      const providerStripeAccount = await this.stripeAccountRepository.findOne({
        where: { provider: { id: job.provider.id } },
      });

      if (!providerStripeAccount?.accountId) {
        throw new BadRequestException('Provider does not have a valid Stripe account configured');
      }

      if (!providerStripeAccount.chargesEnabled || !providerStripeAccount.payoutsEnabled) {
        this.logger.warn(
          `Provider Stripe account not fully enabled: chargesEnabled=${providerStripeAccount.chargesEnabled}, payoutsEnabled=${providerStripeAccount.payoutsEnabled}`,
        );
      }

      // 6. Ensure seeker has a Stripe customer record
      let stripeCustomer = await this.stripeCustomerRepository.findOne({
        where: { seeker: { id: seekerId } },
      });

      if (!stripeCustomer) {
        const seekerEmail = job.seeker.email;
        const stripeCustomerObj = await this.stripeService.create(seekerEmail, seekerEmail, seekerId);
        stripeCustomer = this.stripeCustomerRepository.create({
          seeker: { id: seekerId },
          customerId: stripeCustomerObj.id,
        });
        await this.txHelper.run(async (qr) => { await qr.manager.save(stripeCustomer); });
        this.logger.log(`Created Stripe customer for seeker ${seekerId}: ${stripeCustomerObj.id}`);
      }

      // 7. URLs
      const successUrl = process.env['STRIPE_CHECKOUT_SUCCESS_URL'] || 'http://localhost:3000/subscriptions/success';
      const cancelUrl = process.env['STRIPE_CHECKOUT_CANCEL_URL'] || 'http://localhost:3000/subscriptions/cancel';

      // 8. Create Stripe subscription checkout session
      const { platformCharge } = await this.platformFeeService.getCharge();
      // New model: the GST-inclusive service fee is added on top of each installment. The provider
      // receives the full installment every cycle; the fee (GST inside) is the platform's, every cycle.
      const serviceFeePerCycle = money(installmentAmount * (platformCharge / 100));
      const chargedPerCycle = money(installmentAmount + serviceFeePerCycle);
      const providerPercent = parseFloat(((installmentAmount / chargedPerCycle) * 100).toFixed(2));
      const checkoutSession = await this.stripeService.createSubscriptionCheckoutSession(
        stripeCustomer.customerId,
        installmentAmountCents,
        toCents(serviceFeePerCycle),
        stripeInterval,
        numberOfPeriods,
        selection.id,
        jobId,
        seekerId,
        job.provider.id,
        providerStripeAccount.accountId,
        successUrl,
        cancelUrl,
        providerPercent,
        job.jobRef,
        job.title ?? 'Service Job',
        getFrequencyLabel(contract.paymentFrequency),
        platformCharge,
      );

      // 9. Store mapping in AuditLog for webhook idempotency and state tracking
      const mappingRecord: SubscriptionMappingRecord = {
        selectionId: selection.id,
        subscriptionId: '',
        checkoutSessionId: checkoutSession.sessionId,
        stripeCustomerId: stripeCustomer.customerId,
        durationMonths: job.durationMonths,
        numberOfPeriods,
        monthlyAmount: totalAmount,
        installmentAmount,
        totalAmount,
        currency: job.currency || 'AUD',
        providerStripeAccountId: providerStripeAccount.accountId,
        seekerId,
        providerId: job.provider.id,
        jobId,
        paymentFrequency: contract.paymentFrequency,
      };

      await this.txHelper.run(async (qr) => {
        await qr.manager.save(AuditLog, {
          action: 'STRIPE_CHECKOUT_SESSION_CREATED',
          entityType: 'job',
          entityId: jobId,
          actor: { id: seekerId },
          metadata: mappingRecord,
        });
      });

      this.logger.log(`Subscription checkout session created for job ${jobId}: ${checkoutSession.sessionId}`);

      return {
        url: checkoutSession.url,
        sessionId: checkoutSession.sessionId,
      };
    } catch (error) {
      this.logger.error(`Failed to initiate subscription checkout: ${(error as Error).message}`);
      throw error;
    }
  }

  async getSubscriptionById(jobId: string, userId: string, roles: string[]): Promise<any> {
    const { stripeSubscriptionId } = await this.resolveSubscriptionForJob(jobId, userId, roles);
    if (!stripeSubscriptionId) throw new NotFoundException('Subscription not found');
    const subscription = await this.stripeService.getSubscriptionById(stripeSubscriptionId);
    if (!subscription) throw new NotFoundException('Subscription not found');
    return subscription;
  }

  async getSubscriptionPeriodDetails(jobId: string, userId: string, roles: string[]): Promise<any> {
    const { stripeSubscriptionId } = await this.resolveSubscriptionForJob(jobId, userId, roles);
    if (!stripeSubscriptionId) throw new NotFoundException('Subscription not found');
    const subscriptionPeriod = await this.stripeService.getSubscriptionPeriod(stripeSubscriptionId);
    if (!subscriptionPeriod) throw new NotFoundException('Subscription not found');
    return subscriptionPeriod;
  }

  /** Seeker-initiated cancellation of a recurring subscription with a 14-day notice period (single-task
   *  jobs use POST /api/jobs/{id}/cancel). Requires an in-progress job with ≥1 paid cycle. Takes effect at
   *  requestedAt + 14 days with collection paused (no further charge, no refund of paid cycles); at that
   *  point Stripe's customer.subscription.deleted finalizes the job/payment and marks this PROCESSED. */
  async cancelSubscription(
    jobId: string,
    dto: CancelSubscriptionDto,
    userId: string,
    roles: string[],
  ): Promise<SubscriptionCancellationResponseDto> {
    const isAdmin = roles.some((role) => role.toUpperCase() === 'ADMIN');

    // Keyed on the job id: no client-facing API exposes the Stripe subscription id, and a
    // subscription carries a unique job (@Unique(['job'])), so one job → one subscription.
    const subscription = await this.subscriptionRepository.findOne({
      where: (isAdmin
        ? { job: { id: jobId } }
        : [
            { job: { id: jobId }, seeker: { id: userId } },
            { job: { id: jobId }, provider: { id: userId } },
          ]) as any,
      relations: ['job', 'seeker'],
    });

    if (!subscription) throw new NotFoundException('Subscription not found');

    // Stripe id is derived server-side; it's what the cancellation + cycle lookups key on.
    const stripeSubscriptionId = subscription.stripeSubscriptionId;
    if (!stripeSubscriptionId) {
      throw new BadRequestException('Subscription is not active on Stripe yet and cannot be cancelled');
    }

    const job = subscription.job;

    // Guard: recurring jobs only.
    if (!job || job.serviceDuration === ServiceDuration.SINGLE_TASK) {
      throw new BadRequestException(
        'Only recurring subscription jobs can be cancelled here; single-task jobs use the job cancellation endpoint',
      );
    }

    // Guard: block only terminal jobs — there's nothing left to cancel once the engagement has
    // ended. SELECTED is intentionally allowed: cycles can be billing before the provider advances
    // the job to IN_PROGRESS, and the seeker must still be able to cancel while being charged.
    // Whether the subscription is actually live is already enforced by the stripeSubscriptionId
    // guard above, so no first-cycle requirement is imposed here.
    const terminalStatuses = [JobStatus.COMPLETED, JobStatus.CANCELLED, JobStatus.REJECTED];
    if (terminalStatuses.includes(job.status)) {
      throw new BadRequestException('Subscription cannot be cancelled: the job has already ended');
    }

    // Guard: required elaboration when reason is OTHER.
    if (dto.reason === SubscriptionCancellationReason.OTHER && !dto.customReason?.trim()) {
      throw new BadRequestException('customReason is required when reason is OTHER');
    }

    // Idempotency: don't stack pending cancellation requests.
    const existing = await this.cancellationRequestRepository.findOne({
      where: { subscription: { id: subscription.id }, status: SubscriptionCancellationStatus.PENDING } as any,
    });
    if (existing) {
      throw new BadRequestException('A cancellation request is already pending for this subscription');
    }

    const reasonLabel =
      dto.reason === SubscriptionCancellationReason.OTHER ? (dto.customReason ?? 'other') : dto.reason;

    // Has any billing cycle actually been charged? A live-but-unbilled subscription (still
    // incomplete, or the seeker backing out before the first charge) has nothing to give notice
    // about — cancel it immediately so it can never charge, instead of a 14-day notice.
    const paidCycles = await this.transactionRepository.count({
      where: { stripeSubscriptionId, type: TransactionType.PAYMENT },
    });

    if (paidCycles < 1) {
      const cancelled = await this.stripeService.cancelSubscriptionImmediately(stripeSubscriptionId, reasonLabel);

      const cancelledAt = new Date();
      await this.txHelper.run(async (qr) => {
        await qr.manager.save(SubscriptionCancellationRequest, {
          subscription: { id: subscription.id },
          seeker: { id: subscription.seeker.id },
          reason: dto.reason,
          customReason: dto.customReason ?? null,
          status: SubscriptionCancellationStatus.PROCESSED,
          requestedAt: cancelledAt,
          effectiveAt: cancelledAt,
          processedAt: cancelledAt,
        });

        await qr.manager.update(Subscription, subscription.id, {
          status: SubscriptionStatus.CANCELED,
          endDate: cancelledAt.toISOString().slice(0, 10),
        });

        await qr.manager.save(AuditLog, {
          action: 'SUBSCRIPTION_CANCELLED_IMMEDIATELY',
          entityType: 'subscription',
          entityId: subscription.id,
          actor: { id: userId },
          metadata: { subscriptionId: stripeSubscriptionId, jobId: job.id, reason: dto.reason, paidCycles },
        });
      });

      await this.invalidateJobViews(job.id, subscription.seeker.id);

      return {
        subscription_id: stripeSubscriptionId,
        status: cancelled.status,
        cancel_at_period_end: false,
        cancellation_reason: dto.reason,
        message:
          'Subscription cancelled immediately — it had not started yet (no payment collected), ' +
          'so no notice period applies and nothing further will be charged.',
      } as SubscriptionCancellationResponseDto;
    }

    // 14-day notice period (subscription has been billing).
    const requestedAt = new Date();
    const effectiveAt = new Date(requestedAt.getTime() + 14 * 24 * 60 * 60 * 1000);
    const cancelAtUnix = Math.floor(effectiveAt.getTime() / 1000);

    // Schedule the Stripe cancellation (outside the DB transaction). Pausing collection means
    // the pending cycle is not charged; no refund is issued for already-paid cycles.
    const scheduled = await this.stripeService.scheduleSubscriptionCancellation(
      stripeSubscriptionId,
      cancelAtUnix,
      reasonLabel,
    );

    await this.txHelper.run(async (qr) => {
      await qr.manager.save(SubscriptionCancellationRequest, {
        subscription: { id: subscription.id },
        seeker: { id: subscription.seeker.id },
        reason: dto.reason,
        customReason: dto.customReason ?? null,
        status: SubscriptionCancellationStatus.PENDING,
        requestedAt,
        effectiveAt,
      });

      await qr.manager.update(Subscription, subscription.id, {
        endDate: effectiveAt.toISOString().slice(0, 10),
      });

      await qr.manager.save(AuditLog, {
        action: 'SUBSCRIPTION_CANCELLATION_REQUESTED',
        entityType: 'subscription',
        entityId: subscription.id,
        actor: { id: userId },
        metadata: {
          subscriptionId: stripeSubscriptionId,
          jobId: job.id,
          reason: dto.reason,
          effectiveAt: effectiveAt.toISOString(),
        },
      });
    });

    await this.invalidateJobViews(job.id, subscription.seeker.id);

    const effectiveDate = effectiveAt.toISOString().slice(0, 10);
    return {
      subscription_id: stripeSubscriptionId,
      status: scheduled.status,
      cancel_at_period_end: scheduled.cancel_at_period_end ?? false,
      cancellation_reason: dto.reason,
      message:
        `Subscription will be cancelled on ${effectiveDate} (14-day notice period). ` +
        'No further cycles will be charged; previously paid cycles are non-refundable.',
    } as SubscriptionCancellationResponseDto;
  }
}
