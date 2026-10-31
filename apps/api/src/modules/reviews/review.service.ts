import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual, Not, IsNull } from 'typeorm';
import { Review } from '../../database/entities/review.entity';
import { Job } from '../../database/entities/job.entity';
import { Profile } from '../../database/entities/profile.entity';
import { JobStatus } from '../../database/common/enum';
import { CreateReviewDto } from './dto/create-review.dto';
import { ReviewQueryDto } from './dto/review-query.dto';
import { ReviewResponseDto } from './dto/review-response.dto';
import { PaginatedResponseDto } from '../../interfaces/paginated-response.dto';
import { paginateQuery } from '../../interfaces/paginate-query.util';
import { DomainEventEmitter } from '../../events/domain-event-emitter.service';
import { ReviewCreatedEvent } from './events/review-created.event';

@Injectable()
export class ReviewService {
  constructor(
    @InjectRepository(Review)
    private readonly reviewRepository: Repository<Review>,
    @InjectRepository(Job)
    private readonly jobRepository: Repository<Job>,
    private readonly eventEmitter: DomainEventEmitter,
  ) {}

  private async upsertRatingSummary(providerId: string, rating: number): Promise<void> {
    await this.reviewRepository.manager.query(
      `INSERT INTO provider_rating_summaries (provider_id, average_rating, review_count, updated_at)
       VALUES ($1, $2, 1, NOW())
       ON CONFLICT (provider_id) DO UPDATE
       SET average_rating = ROUND(
             (provider_rating_summaries.average_rating * provider_rating_summaries.review_count + $2)
             / (provider_rating_summaries.review_count + 1)::numeric, 1),
           review_count = provider_rating_summaries.review_count + 1,
           updated_at   = NOW()`,
      [providerId, rating],
    );
  }

  async create(seekerId: string, dto: CreateReviewDto): Promise<{ review: Review; providerProfileId: string | null }> {
    const job = await this.jobRepository.findOne({
      where: { id: dto.jobId } as any,
      relations: ['seeker', 'provider'],
    });

    if (!job) throw new NotFoundException(`Job "${dto.jobId}" not found`);
    if ((job.seeker as any).id !== seekerId) throw new ForbiddenException('You can only review jobs you posted');
    if (job.status !== JobStatus.COMPLETED) throw new BadRequestException('Job must be completed before leaving a review');
    if (!job.provider) throw new BadRequestException('No provider was assigned for this job');

    const existing = await this.reviewRepository.findOne({ where: { jobId: dto.jobId } });
    if (existing) throw new ConflictException('A review already exists for this job');

    const providerId = (job.provider as any).id as string;

    const review = this.reviewRepository.create({
      jobId: dto.jobId,
      seekerId,
      providerId,
      rating: dto.rating,
      deliveredOnBudget: dto.deliveredOnBudget ?? null,
      deliveredOnTime: dto.deliveredOnTime ?? null,
      title: dto.title ?? null,
      comment: dto.comment ?? null,
    });

    const saved = await this.reviewRepository.save(review);
    await this.upsertRatingSummary(providerId, dto.rating);

    // Drives the cached recommendation / on-time / on-budget rates via ProviderStatsListener.
    this.eventEmitter.emit(new ReviewCreatedEvent(saved.id, providerId, seekerId, dto.rating));

    // providerId is the USER id; resolve the PROFILE id so the controller can bust the caches that
    // are keyed by profile id (the reviews list and the provider-detail page).
    const providerProfile = await this.jobRepository.manager.findOne(Profile, {
      where: { user_id: providerId } as any,
      select: ['id'],
    });

    return { review: saved, providerProfileId: providerProfile?.id ?? null };
  }

  async findTestimonials(): Promise<ReviewResponseDto[]> {
    const reviews = await this.reviewRepository.find({
      where: { rating: MoreThanOrEqual(4), comment: Not(IsNull()) },
      relations: ['seeker', 'seeker.profile'],
      order: { rating: 'DESC', createdAt: 'DESC' },
      take: 10,
    });
    return reviews.map(ReviewResponseDto.fromTestimonial);
  }

  async findByProvider(providerId: string, query: ReviewQueryDto): Promise<PaginatedResponseDto<ReviewResponseDto>> {

    const profile = await this.jobRepository.manager.findOne(Profile, {
      where: { id: providerId } as any,
      select: ['user_id'],
    });
    const providerUserId = profile?.user_id ?? providerId;

    const options = paginateQuery<Review>(query);
    const [data, total] = await this.reviewRepository.findAndCount({
      ...options,
      where: { providerId: providerUserId },
      relations: ['job', 'seeker', 'seeker.profile'],
    });
    return new PaginatedResponseDto(data.map(ReviewResponseDto.from), total, query.page, query.limit);
  }
}
