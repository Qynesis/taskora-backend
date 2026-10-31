import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityTarget, In, ObjectLiteral, Repository } from 'typeorm';
import { User } from '../../database/entities/user.entity';
import { Profile } from '../../database/entities/profile.entity';
import { Job } from '../../database/entities/job.entity';
import { Payment } from '../../database/entities/payment.entity';
import { RefundRequest } from '../../database/entities/refund-request.entity';
import { Subscription } from '../../database/entities/subscription.entity';
import { StripeAccount } from '../../database/entities/stripe-account.entity';
import { StripeCustomer } from '../../database/entities/stripe-customer.entity';
import { FcmToken } from '../../database/entities/fcm-token.entity';
import { UserNotificationSettings } from '../../database/entities/user_notification_settings.entity';
import { SavedPaymentMethod } from '../../database/entities/saved-payment-method.entity';
import { ProviderMedia } from '../../database/entities/provider_media.entity';
import { ProviderVerificationStepFile } from '../../database/entities/provider_verification_step_files.entity';
import { ProviderBankDetails } from '../../database/entities/provider_bank_details.entity';
import { ProviderCertification } from '../../database/entities/provider_certification.entity';
import { ProviderEmployee } from '../../database/entities/provider_employee.entity';
import { ProviderProfessionalDetails } from '../../database/entities/provider_professional_details.entity';
import { ProviderWorkInfo } from '../../database/entities/provider_work_info.entity';
import { ProviderVerificationCase } from '../../database/entities/provider_verification_cases.entity';
import { Bid } from '../../database/entities/bid.entity';
import {
  BidStatus,
  JobStatus,
  PaymentStatus,
  RefundRequestStatus,
  SubscriptionStatus,
} from '../../database/common/enum';
import { TransactionHelper } from '../../database/transaction.helper';
import { AzureStorageService } from '../../storage/storage.service';
import { StripeService } from '../stripe/stripe.service';
import { AuditService } from '../audit/audit.service';
import { SupabaseAdminService } from './supabase-admin.service';

/**
 * Handles user-initiated account deletion (Google Play / GDPR "delete my account").
 *
 * NOT a hard delete: financial/contractual/safety records (payments, jobs, subscriptions, refunds,
 * reviews, reports, audit logs) are retained for legal/tax compliance and re-pointed at an anonymized
 * user; personal data with no retention basis (ID docs, bank details, cards, verification files, push
 * tokens, provider business data) is purged, and external identities (Stripe account/customer, Supabase
 * auth user) are removed. The user/profile rows are kept but anonymized in place (email scrubbed, name →
 * "Deleted User", isActive=false) so the many read-time joins that resolve a name still render "Deleted
 * User" instead of blanking the retained safety trail. Login is blocked by isActive=false + removing the
 * Supabase identity.
 */
@Injectable()
export class AccountDeletionService {
  private readonly logger = new Logger(AccountDeletionService.name);

  /** Job states that represent an in-flight engagement — deletion is blocked while any exist. */
  private static readonly ACTIVE_JOB_STATUSES: JobStatus[] = [
    JobStatus.POSTED,
    JobStatus.BIDDING,
    JobStatus.SELECTED,
    JobStatus.PENDING,
    JobStatus.IN_PROGRESS,
  ];

  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(Profile) private readonly profileRepo: Repository<Profile>,
    @InjectRepository(Job) private readonly jobRepo: Repository<Job>,
    @InjectRepository(Payment) private readonly paymentRepo: Repository<Payment>,
    @InjectRepository(RefundRequest) private readonly refundRepo: Repository<RefundRequest>,
    @InjectRepository(Subscription) private readonly subscriptionRepo: Repository<Subscription>,
    @InjectRepository(StripeAccount) private readonly stripeAccountRepo: Repository<StripeAccount>,
    @InjectRepository(StripeCustomer) private readonly stripeCustomerRepo: Repository<StripeCustomer>,
    @InjectRepository(ProviderMedia) private readonly providerMediaRepo: Repository<ProviderMedia>,
    @InjectRepository(ProviderVerificationStepFile)
    private readonly verificationFileRepo: Repository<ProviderVerificationStepFile>,
    private readonly txHelper: TransactionHelper,
    private readonly storage: AzureStorageService,
    private readonly stripeService: StripeService,
    private readonly auditService: AuditService,
    private readonly supabaseAdmin: SupabaseAdminService,
  ) {}

  async deleteMyAccount(userId: string): Promise<void> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // 1. Refuse to delete while the user has money or work in flight.
    const blockers = await this.collectActiveObligations(userId);
    if (blockers.length > 0) {
      throw new BadRequestException(
        `You can't delete your account while you have ${this.formatBlockers(blockers)}. ` +
          `Please resolve these first, then try again.`,
      );
    }

    // 2. Capture everything we need BEFORE the rows are gone: blob URLs to purge from Azure,
    //    and the external Stripe identifiers to delete after the DB transaction commits.
    const profile = await this.profileRepo.findOne({ where: { user_id: userId } });
    const blobUrls = profile ? await this.collectPersonalBlobUrls(profile) : [];

    const stripeAccount = await this.stripeAccountRepo.findOne({
      where: { provider: { id: userId } },
      relations: { provider: true },
    });
    const stripeCustomer = await this.stripeCustomerRepo.findOne({
      where: { seeker: { id: userId } },
      relations: { seeker: true },
    });
    const stripeAccountId = stripeAccount?.accountId ?? null;
    const stripeCustomerId = stripeCustomer?.customerId ?? null;

    // 3. Atomically purge personal data + anonymize the user & profile rows in place.
    await this.txHelper.run(async (qr) => {
      const m = qr.manager;
      const deleteByColumn = (entity: EntityTarget<ObjectLiteral>, column: string, value: string) =>
        m.createQueryBuilder().delete().from(entity).where(`${column} = :v`, { v: value }).execute();

      // User-direct personal children (each keyed by its own FK column).
      await deleteByColumn(FcmToken, 'user_id', userId);
      await deleteByColumn(UserNotificationSettings, 'user_id', userId);
      await deleteByColumn(SavedPaymentMethod, 'seeker_user_id', userId);
      await deleteByColumn(StripeAccount, 'provider_user_id', userId);
      await deleteByColumn(StripeCustomer, 'seeker_user_id', userId);

      // Withdraw the provider's still-live bids so a seeker can't accept a bid from — and thereby
      // assign a job to — a now-deleted, anonymized provider. Historical accepted/declined bids are
      // left intact as part of their jobs' records.
      await m
        .createQueryBuilder()
        .delete()
        .from(Bid)
        .where('provider_user_id = :id AND status = :status', { id: userId, status: BidStatus.SUBMITTED })
        .execute();

      if (profile) {
        const pid = profile.id;
        // Purge all provider profile data (business info, rates, media, bank details, licences,
        // employees, and the verification case → steps → files chain). The profile row itself is
        // kept and anonymized below, so we delete these children explicitly rather than relying on
        // the profile's ON DELETE CASCADE.
        await deleteByColumn(ProviderVerificationCase, 'profile_id', pid); // cascades steps → files
        await deleteByColumn(ProviderMedia, 'profile_id', pid);
        await deleteByColumn(ProviderProfessionalDetails, 'profile_id', pid);
        await deleteByColumn(ProviderWorkInfo, 'profile_id', pid);
        await deleteByColumn(ProviderBankDetails, 'profile_id', pid);
        await deleteByColumn(ProviderCertification, 'profile_id', pid);
        await deleteByColumn(ProviderEmployee, 'profile_id', pid);

        // Anonymize the profile in place → a non-identifying "Deleted User" tombstone so retained
        // audit/report/warning records still resolve a name (some join with innerJoin) instead of
        // blanking out or dropping the row entirely.
        // Scrub with empty strings / a placeholder DOB rather than NULL — several of these
        // columns are NOT NULL. avatarUrl is nullable so it is cleared to null.
        await m.update(
          Profile,
          { id: pid },
          {
            firstName: 'Deleted',
            lastName: 'User',
            phone: '',
            phoneVerified: false,
            avatarUrl: null,
            date_of_birth: new Date('1970-01-01'),
            streetAddress: '',
            suburb: '',
            state: '',
            postcode: '',
            country: '',
          },
        );
      }

      // Anonymize the user row — kept (not deleted) because payments/jobs/subscriptions reference it
      // with ON DELETE RESTRICT, and because retained records join to it for display. Freeing the
      // email lets the person re-register. accountDeletedAt is the authoritative "deleted" marker
      // (distinct from the admin moderation flags); isActive=false is set as a derived consequence
      // so existing isActive-based exclusions hide the account. Login is blocked via the auth gate.
      await m.update(
        User,
        { id: userId },
        {
          email: `deleted+${userId}@deleted.invalid`,
          emailVerified: false,
          isActive: false,
          accountDeletedAt: new Date(),
        },
      );
    });

    // 4. Best-effort external cleanup — post-commit, never fails the request.
    await this.purgeBlobs(blobUrls);
    if (stripeAccountId) await this.stripeService.deleteConnectAccount(stripeAccountId);
    if (stripeCustomerId) await this.stripeService.deleteCustomer(stripeCustomerId);
    await this.supabaseAdmin.deleteAuthUser(userId);

    try {
      await this.auditService.log({
        action: 'ACCOUNT_DELETED',
        entityType: 'user',
        entityId: userId,
        actorId: userId,
      });
    } catch (error) {
      this.logger.warn(`Failed to write ACCOUNT_DELETED audit log for ${userId}: ${(error as Error).message}`);
    }

    this.logger.log(`Account ${userId} deleted (anonymized + personal data purged)`);
  }

  /** Returns a list of human-readable active obligations that block deletion (empty = clear). */
  private async collectActiveObligations(userId: string): Promise<string[]> {
    const blockers: string[] = [];

    const activeJobs = await this.jobRepo.count({
      where: [
        { seeker: { id: userId }, status: In(AccountDeletionService.ACTIVE_JOB_STATUSES) },
        { provider: { id: userId }, status: In(AccountDeletionService.ACTIVE_JOB_STATUSES) },
      ],
    });
    if (activeJobs > 0) blockers.push('an active job');

    const openPayments = await this.paymentRepo.count({
      where: [
        { seeker: { id: userId }, status: In([PaymentStatus.PENDING, PaymentStatus.DISPUTED]) },
        { provider: { id: userId }, status: In([PaymentStatus.PENDING, PaymentStatus.DISPUTED]) },
      ],
    });
    if (openPayments > 0) blockers.push('a pending or disputed payment');

    const pendingRefunds = await this.refundRepo.count({
      where: { seeker: { id: userId }, status: RefundRequestStatus.PENDING },
    });
    if (pendingRefunds > 0) blockers.push('a pending refund request');

    const activeSubscriptions = await this.subscriptionRepo.count({
      where: [
        {
          seeker: { id: userId },
          status: In([SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIALING, SubscriptionStatus.PAST_DUE]),
        },
        {
          provider: { id: userId },
          status: In([SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIALING, SubscriptionStatus.PAST_DUE]),
        },
      ],
    });
    if (activeSubscriptions > 0) blockers.push('an active subscription');

    return blockers;
  }

  /** Collects the Azure blob URLs of the user's personal files (avatar, media, ID documents). */
  private async collectPersonalBlobUrls(profile: Profile): Promise<string[]> {
    const urls: string[] = [];

    if (profile.avatarUrl) urls.push(profile.avatarUrl);

    const media = await this.providerMediaRepo.find({ where: { profileId: profile.id } });
    urls.push(...media.map((m) => m.url).filter(Boolean));

    const files = await this.verificationFileRepo
      .createQueryBuilder('f')
      .innerJoin('f.step', 's')
      .innerJoin('s.case', 'c')
      .where('c.profile_id = :pid', { pid: profile.id })
      .getMany();
    urls.push(...files.map((f) => f.fileUrl).filter(Boolean));

    return urls;
  }

  private async purgeBlobs(urls: string[]): Promise<void> {
    for (const url of urls) {
      try {
        await this.storage.deleteByUrl(url);
      } catch (error) {
        this.logger.warn(`Failed to delete blob ${url}: ${(error as Error).message}`);
      }
    }
  }

  private formatBlockers(blockers: string[]): string {
    if (blockers.length === 1) return blockers[0]!;
    return `${blockers.slice(0, -1).join(', ')} and ${blockers[blockers.length - 1]!}`;
  }
}
