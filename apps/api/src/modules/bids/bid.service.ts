import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BidStatus, JobStatus, JobType } from '../../database/common/enum';
import { Bid } from '../../database/entities/bid.entity';
import { Job } from '../../database/entities/job.entity';
import { User } from '../../database/entities/user.entity';
import { Profile } from '../../database/entities/profile.entity';
import { ProviderWorkInfo } from '../../database/entities/provider_work_info.entity';
import { ProviderProfessionalDetails } from '../../database/entities/provider_professional_details.entity';
import { ProviderBankDetails } from '../../database/entities/provider_bank_details.entity';
import { ProviderCategory } from '../../database/entities/provider-category.entity';
import { StripeAccount } from '../../database/entities/stripe-account.entity';
import { StripeOnboardingState } from '../../database/common/stripe-onboarding-state';
import { Conversation } from '../../database/entities/conversation.entity';
import { DirectMessage } from '../../database/entities/direct-message.entity';
import { CreateBidDto } from './dto/create-bid.dto';
import { UpdateBidDto } from './dto/update-bid.dto';
import { BidQueryDto } from './dto/bid-query.dto';
import { BidCreatedEvent } from './events/bid-created.event';
import { BidUpdatedEvent } from './events/bid-updated.event';
import { BidStatusChangedEvent } from './events/bid-status-changed.event';
import { BidResponseDto } from './dto/bid-response.dto';
import { MyBidsResponseDto } from './dto/my-bids-response.dto';
import { PaginatedResponseDto } from '../../interfaces/paginated-response.dto';
import { paginateQuery } from '../../interfaces/paginate-query.util';
import { DomainEventEmitter } from '../../events/domain-event-emitter.service';

@Injectable()
export class BidService {
  constructor(
    @InjectRepository(Bid)
    private readonly bidRepository: Repository<Bid>,
    @InjectRepository(Job)
    private readonly jobRepository: Repository<Job>,
    private readonly eventEmitter: DomainEventEmitter,
  ) { }

  async update(id: string, dto: UpdateBidDto, providerId: string): Promise<Bid> {
    const record = await this.bidRepository.findOne({
      where: { id } as any,
      relations: { provider: true, job: { seeker: true } },
    });
    if (!record) {
      throw new NotFoundException(`Bid with id "${id}" not found`);
    }
    if (record.provider.id !== providerId) {
      throw new ForbiddenException('You do not own this bid');
    }
    if (record.job.status !== JobStatus.POSTED && record.job.status !== JobStatus.BIDDING) {
      throw new BadRequestException('This job is no longer accepting bid updates');
    }

    if (dto.price !== undefined) {
      // Bids may exceed the job budget — providers can quote above the seeker's budget.
      record.price = dto.price;
    }
    const saved = await this.bidRepository.save(record);
    // Explicitly re-attach the loaded relation so the controller can read
    // job.seeker.id for cache invalidation (TypeORM save() does not guarantee
    // nested relations survive on the returned entity).
    saved.job = record.job;

    this.eventEmitter.emit(
      new BidUpdatedEvent(
        saved.id,
        record.job.id,
        record.job.seeker.id,
        providerId,
        Number(saved.price),
        saved.currency,
        dto.message,
      ),
    );

    return saved;
  }

  async create(jobId: string, providerId: string, dto: CreateBidDto): Promise<Bid> {
    const job = await this.jobRepository.findOne({
      where: { id: jobId } as any,
      relations: { seeker: true },
    });
    if (!job) throw new NotFoundException(`Job "${jobId}" not found`);
    if (job.status !== JobStatus.POSTED && job.status !== JobStatus.BIDDING) {
      throw new BadRequestException('This job is no longer accepting bids');
    }

    await this.assertProviderProfileComplete(providerId);

    const existingBid = await this.bidRepository.findOne({
      where: { job: { id: jobId }, provider: { id: providerId } } as any,
    });
    if (existingBid) {
      throw new BadRequestException('You have already submitted a bid for this job — use the update endpoint to revise your bid');
    }

    // Bids may exceed the job budget — providers can quote above the seeker's budget.

    const record = this.bidRepository.create({
      job: { id: jobId },
      provider: { id: providerId },
      price: dto.price,
    } as any) as unknown as Bid;

    const saved = await this.bidRepository.save(record);
    // Attach the loaded job (with seeker) so the controller can read
    // job.seeker.id for cache invalidation.
    saved.job = job;

    if (job.status === JobStatus.POSTED) {
      await this.jobRepository.update(jobId, { status: JobStatus.BIDDING });
    }

    this.eventEmitter.emit(
      new BidCreatedEvent(saved.id, jobId, providerId, Number(saved.price), saved.currency, dto.message),
    );
    return saved;
  }

  async findMyBids(providerId: string, query: BidQueryDto): Promise<PaginatedResponseDto<MyBidsResponseDto>> {
    const qb = this.bidRepository
      .createQueryBuilder('bid')
      .leftJoinAndSelect('bid.job', 'job')
      .leftJoinAndSelect('job.category', 'category')
      .leftJoinAndSelect('job.seeker', 'seeker')
      .leftJoinAndSelect('seeker.profile', 'seekerProfile')
      .where('bid.provider_user_id = :providerId', { providerId })
      .andWhere('job.type = :jobType', { jobType: JobType.BIDDING });

    if (query.search) {
      qb.andWhere('(job.jobRef = :search OR job.title ILIKE :searchTitle)', {
        search: query.search,
        searchTitle: `%${query.search}%`,
      });
    }
    if (query.bidStatus) {
      qb.andWhere('bid.status = :bidStatus', { bidStatus: query.bidStatus });
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
    if (query.month) {
      qb.andWhere('EXTRACT(MONTH FROM bid.createdAt) = :month', { month: query.month });
    }
    if (query.year) {
      qb.andWhere('EXTRACT(YEAR FROM bid.createdAt) = :year', { year: query.year });
    }

    qb.orderBy('bid.createdAt', 'DESC')
      .skip((query.page - 1) * query.limit)
      .take(query.limit);

    const [data, total] = await qb.getManyAndCount();
    const items = data.map((bid) => {
      const profile = bid.job?.seeker?.profile;
      const seekerName = [profile?.firstName, profile?.lastName].filter(Boolean).join(' ')
        || bid.job?.seeker?.email
        || '';
      return MyBidsResponseDto.from(bid, seekerName);
    });
    return new PaginatedResponseDto(items, total, query.page, query.limit);
  }

  async getMyBidCounts(providerId: string): Promise<{ bidding: number; accepted: number; declined: number }> {
    const rows = await this.bidRepository
      .createQueryBuilder('bid')
      .select('bid.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .innerJoin('bid.job', 'job')
      .where('bid.provider_user_id = :providerId', { providerId })
      .andWhere('job.type = :jobType', { jobType: JobType.BIDDING })
      .andWhere('bid.status IN (:...statuses)', {
        statuses: [BidStatus.SUBMITTED, BidStatus.ACCEPTED, BidStatus.DECLINED],
      })
      .groupBy('bid.status')
      .getRawMany<{ status: string; count: string }>();

    const counts = { bidding: 0, accepted: 0, declined: 0 };
    for (const row of rows) {
      if (row.status === BidStatus.SUBMITTED) counts.bidding = Number(row.count);
      else if (row.status === BidStatus.ACCEPTED) counts.accepted = Number(row.count);
      else if (row.status === BidStatus.DECLINED) counts.declined = Number(row.count);
    }
    return counts;
  }

  async findByJob(jobId: string, query: BidQueryDto, seekerId: string): Promise<PaginatedResponseDto<BidResponseDto>> {
    const job = await this.jobRepository.findOne({
      where: { id: jobId } as any,
      relations: { seeker: true },
    });
    if (!job) {
      throw new NotFoundException(`Job "${jobId}" not found`);
    }
    if (job.seeker.id !== seekerId) {
      throw new ForbiddenException('You are not the seeker of this job');
    }

    const options = paginateQuery<Bid>(query);
    const [bids, total] = await this.bidRepository.findAndCount({
      ...options,
      where: { job: { id: jobId }, status: BidStatus.SUBMITTED } as any,
      relations: ['job', 'job.category', 'provider', 'provider.profile'],
    });

    if (bids.length === 0) {
      return new PaginatedResponseDto([], total, query.page, query.limit);
    }

    const providerIds = bids.map((b) => b.provider.id);

    // Batch: business names from provider_work_info
    const workInfoRows = await this.bidRepository.manager
      .createQueryBuilder()
      .select('u.id', 'userId')
      .addSelect('wi.businessName', 'businessName')
      .from(User, 'u')
      .leftJoin(Profile, 'p', 'p.user_id = u.id')
      .leftJoin(ProviderWorkInfo, 'wi', 'wi.profile_id = p.id')
      .where('u.id IN (:...providerIds)', { providerIds })
      .getRawMany<{ userId: string; businessName: string | null }>();

    const businessNameMap = new Map(workInfoRows.map((r) => [r.userId, r.businessName]));

    // Batch: average ratings from summary table
    const ratingRows = await this.bidRepository.manager
      .createQueryBuilder()
      .select('prs.provider_id', 'providerId')
      .addSelect('COALESCE(prs.average_rating, 0)', 'avgRating')
      .from('provider_rating_summaries', 'prs')
      .where('prs.provider_id IN (:...providerIds)', { providerIds })
      .getRawMany<{ providerId: string; avgRating: string }>();

    const ratingMap = new Map(ratingRows.map((r) => [r.providerId, Number(r.avgRating)]));

    // Batch: conversations + unread message counts (seeker is the viewer)
    const conversationRows = await this.bidRepository.manager
      .createQueryBuilder()
      .select('c.id', 'conversationId')
      .addSelect('c.provider_id', 'providerId')
      .addSelect('COUNT(dm.id)', 'unreadCount')
      .from(Conversation, 'c')
      .leftJoin(
        DirectMessage,
        'dm',
        'dm.conversation_id = c.id AND dm.is_read = false AND dm.sender_id != :seekerId',
        { seekerId },
      )
      .where('c.seeker_id = :seekerId', { seekerId })
      .andWhere('c.provider_id IN (:...providerIds)', { providerIds })
      .groupBy('c.id')
      .addGroupBy('c.provider_id')
      .getRawMany<{ conversationId: string; providerId: string; unreadCount: string }>();

    const conversationMap = new Map(
      conversationRows.map((r) => [r.providerId, { conversationId: r.conversationId, unreadCount: Number(r.unreadCount) }]),
    );

    const data = bids.map((bid) => {
      const profile = bid.provider.profile;
      const businessName = businessNameMap.get(bid.provider.id) ?? '';
      const conv = conversationMap.get(bid.provider.id);

      return BidResponseDto.from(
        bid,
        {
          id: bid.provider.id,
          name: businessName,
          email: bid.provider.email,
          phone: profile?.phone ?? null,
          avatarUrl: profile?.avatarUrl ?? null,
          avgRating: ratingMap.get(bid.provider.id) ?? 0,
        },
        conv?.conversationId ?? null,
        conv?.unreadCount ?? 0,
      );
    });

    return new PaginatedResponseDto(data, total, query.page, query.limit);
  }

  async decline(bidId: string, seekerId: string): Promise<Bid> {
    const bid = await this.bidRepository.findOne({
      where: { id: bidId } as any,
      relations: ['job', 'job.seeker', 'provider'],
    });
    if (!bid) throw new NotFoundException(`Bid "${bidId}" not found`);
    if (bid.job.seeker.id !== seekerId) throw new ForbiddenException('You are not the seeker of this job');
    if (bid.status !== BidStatus.SUBMITTED) {
      throw new BadRequestException(`Only submitted bids can be declined (current status: ${bid.status})`);
    }

    bid.status = BidStatus.DECLINED;
    const saved = await this.bidRepository.save(bid);

    this.eventEmitter.emit(
      new BidStatusChangedEvent(saved.id, bid.job.id, bid.job.title ?? '', bid.provider.id, BidStatus.SUBMITTED, BidStatus.DECLINED, seekerId),
    );

    return saved;
  }

  async findOne(id: string): Promise<Bid> {
    const record = await this.bidRepository.findOneBy({ id } as any);
    if (!record) {
      throw new NotFoundException(`Bid with id "${id}" not found`);
    }
    return record;
  }

  private async assertProviderProfileComplete(providerId: string): Promise<void> {
    const hasCategorySubquery = this.bidRepository.manager
      .createQueryBuilder()
      .subQuery()
      .select('COUNT(*)')
      .from(ProviderCategory, 'pc')
      .where('pc.profile_id = p.id')
      .getQuery();

    const row = await this.bidRepository.manager
      .createQueryBuilder()
      .select(
        `p.first_name IS NOT NULL AND p.first_name <> '' ` +
        `AND p.last_name IS NOT NULL AND p.last_name <> '' ` +
        `AND p.phone IS NOT NULL AND p.phone <> '' ` +
        `AND p.date_of_birth IS NOT NULL ` +
        `AND p.street_address IS NOT NULL AND p.street_address <> '' ` +
        `AND p.suburb IS NOT NULL AND p.suburb <> '' ` +
        `AND p.state IS NOT NULL AND p.state <> '' ` +
        `AND p.postcode IS NOT NULL AND p.postcode <> '' ` +
        `AND p.country IS NOT NULL AND p.country <> ''`,
        'profileComplete',
      )
      .addSelect('wi.profile_id IS NOT NULL', 'workInfoComplete')
      .addSelect('pd.profile_id IS NOT NULL', 'professionalDetailsComplete')
      .addSelect(`(${hasCategorySubquery})::int > 0`, 'hasCategory')
      .addSelect('bd.profile_id IS NOT NULL', 'bankDetailsComplete')
      // onboarding_state rather than the raw charges/payouts booleans: Stripe turns those on
      // optimistically while it verifies the identity document in the background, so an account
      // under review or with a failed verification (e.g. name/document mismatch) still reads
      // charges/payouts = true. deriveOnboardingSnapshot folds in requirements/errors/pending so
      // only a fully verified, clean account is 'enabled' — which is what bidding must require.
      .addSelect('sa.onboarding_state', 'onboardingState')
      .addSelect('sa.account_id IS NOT NULL', 'hasStripeAccount')
      .from(Profile, 'p')
      .leftJoin(ProviderWorkInfo, 'wi', 'wi.profile_id = p.id')
      .leftJoin(ProviderProfessionalDetails, 'pd', 'pd.profile_id = p.id')
      .leftJoin(ProviderBankDetails, 'bd', 'bd.profile_id = p.id')
      .leftJoin(StripeAccount, 'sa', 'sa.provider_user_id = p.user_id')
      .where('p.user_id = :providerId', { providerId })
      .getRawOne<{
        profileComplete: boolean;
        workInfoComplete: boolean;
        professionalDetailsComplete: boolean;
        hasCategory: boolean;
        bankDetailsComplete: boolean;
        hasStripeAccount: boolean;
        onboardingState: StripeOnboardingState | null;
      }>();

    // Each gate carries an errorCode so the app can route the provider straight to the screen that
    // fixes it instead of string-matching the prose. STRIPE_ONBOARDING_INCOMPLETE in particular
    // should send them to GET /api/profile/stripe/status, which returns the specific
    // requirementsDue / disabledReason that are too raw to put in a user-facing message here.
    if (!row) {
      throw new BadRequestException({
        message: 'Please complete your account profile before bidding.',
        errorCode: 'PROVIDER_PROFILE_MISSING',
      });
    }
    if (!row.profileComplete) {
      throw new BadRequestException({
        message: 'Please complete your personal profile (name, phone, date of birth and address) before bidding.',
        errorCode: 'PROVIDER_PROFILE_INCOMPLETE',
      });
    }
    if (!row.workInfoComplete) {
      throw new BadRequestException({
        message: 'Please complete your business information (business name and ABN) before bidding.',
        errorCode: 'PROVIDER_WORK_INFO_INCOMPLETE',
      });
    }
    if (!row.professionalDetailsComplete) {
      throw new BadRequestException({
        message: 'Please complete your professional details and rates before bidding.',
        errorCode: 'PROVIDER_PROFESSIONAL_DETAILS_INCOMPLETE',
      });
    }
    if (!row.hasCategory) {
      throw new BadRequestException({
        message: 'Please add at least one service category to your professional details before bidding.',
        errorCode: 'PROVIDER_CATEGORY_REQUIRED',
      });
    }
    if (!row.bankDetailsComplete) {
      throw new BadRequestException({
        message: 'Please complete your bank details before bidding.',
        errorCode: 'PROVIDER_BANK_DETAILS_INCOMPLETE',
      });
    }
    if (!row.hasStripeAccount) {
      throw new BadRequestException({
        message: 'Please connect your Stripe payout account before bidding.',
        errorCode: 'STRIPE_ACCOUNT_NOT_CONNECTED',
      });
    }
    if (row.onboardingState !== 'enabled') {
      throw new BadRequestException({
        message: 'Your Stripe account is not fully verified yet. Please finish the outstanding Stripe requirements before bidding.',
        errorCode: 'STRIPE_ONBOARDING_INCOMPLETE',
      });
    }
  }
}
