import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Job } from '../../database/entities/job.entity';
import { JobPhoto } from '../../database/entities/job-photo.entity';
import { Profile } from '../../database/entities/profile.entity';
import { Conversation } from '../../database/entities/conversation.entity';
import { JobStatus, JobType } from '../../database/common/enum';
import { CreateBookingDto } from './dto/create-booking.dto';
import { BookingQueryDto, BOOKING_STATUS_FILTER_TO_JOB_STATUS } from './dto/booking-query.dto';
import { BookingListItemDto, BookingDetailDto } from './dto/booking-response.dto';
import { PaginatedResponseDto } from '../../interfaces/paginated-response.dto';
import { TransactionHelper } from '../../database/transaction.helper';
import { DomainEventEmitter } from '../../events/domain-event-emitter.service';
import { BookingCreatedEvent } from './events/booking-created.event';
import { BookingStatusChangedEvent } from './events/booking-status-changed.event';
import { IdResponseDto } from '../../interfaces';

@Injectable()
export class BookingService {
  constructor(
    @InjectRepository(Job)
    private readonly jobRepository: Repository<Job>,
    @InjectRepository(JobPhoto)
    private readonly jobPhotoRepository: Repository<JobPhoto>,
    @InjectRepository(Conversation)
    private readonly conversationRepository: Repository<Conversation>,
    private readonly txHelper: TransactionHelper,
    private readonly eventEmitter: DomainEventEmitter,
  ) {}

  // ─── Seeker ───────────────────────────────────────────────────────────────────

  private async generateJobRef(): Promise<string> {
    while (true) {
      const ref = `JOB-${Math.floor(100000 + Math.random() * 900000)}`;
      const exists = await this.jobRepository.findOne({ where: { jobRef: ref } as any });
      if (!exists) return ref;
    }
  }

  async create(seekerUserId: string, dto: CreateBookingDto): Promise<IdResponseDto> {
    const providerProfile = await this.jobRepository.manager.findOne(Profile, {
      where: { id: dto.providerProfileId } as any,
      relations: { user: true },
    });
    if (!providerProfile) {
      throw new NotFoundException(`Provider profile "${dto.providerProfileId}" not found`);
    }
    const providerUserId = (providerProfile as any).user.id as string;
    const jobRef = await this.generateJobRef();

    const saved = await this.txHelper.run(async (qr) => {
      const job = this.jobRepository.create({
        type: JobType.DIRECT,
        jobRef,
        seeker: { id: seekerUserId } as any,
        provider: { id: providerUserId } as any,
        description: dto.description,
        category: dto.categoryId ? ({ id: dto.categoryId } as any) : null,
        locationText: dto.locationText ?? null,
        engagement: dto.engagement,
        durationMonths: dto.durationMonths ?? null,
        status: JobStatus.PENDING,
      });

      const savedJob = await qr.manager.save(job);

      if (dto.photos?.length) {
        const photos = dto.photos.map((p) =>
          this.jobPhotoRepository.create({
            job: { id: savedJob.id } as any,
            fileUrl: p.fileUrl,
            sortOrder: p.sortOrder ?? 0,
          }),
        );
        await qr.manager.save(photos);
      }

      return savedJob;
    });

    this.eventEmitter.emit(new BookingCreatedEvent(saved.id, providerUserId, seekerUserId));
    return { id: saved.id };
  }

  /** Seeker cancels their own booking */
  async cancelBySeeker(seekerUserId: string, bookingId: string): Promise<BookingDetailDto> {
    const job = await this.jobRepository.findOne({
      where: { id: bookingId, type: JobType.DIRECT, seeker: { id: seekerUserId } } as any,
      relations: { provider: true },
    });
    if (!job) throw new NotFoundException(`Booking "${bookingId}" not found`);
    if (job.status !== JobStatus.PENDING) {
      throw new BadRequestException(`Only pending bookings can be cancelled`);
    }
    job.status = JobStatus.CANCELLED;
    await this.jobRepository.save(job);

    this.eventEmitter.emit(
      new BookingStatusChangedEvent(bookingId, seekerUserId, (job.provider as any).id, JobStatus.CANCELLED, seekerUserId),
    );

    return this.findDetailOrFail(bookingId);
  }

  async findBookings(
    userId: string,
    roles: string[],
    query: BookingQueryDto,
  ): Promise<PaginatedResponseDto<BookingListItemDto>> {
    const isProvider = roles.some((r) => r.toUpperCase() === 'PROVIDER');

    const qb = this.jobRepository
      .createQueryBuilder('job')
      .leftJoinAndSelect('job.category', 'category')
      .where('job.type = :type', { type: JobType.DIRECT });

    if (isProvider) {
      qb.leftJoinAndSelect('job.seeker', 'seeker')
        .leftJoinAndSelect('seeker.profile', 'seekerProfile')
        .andWhere('job.provider_user_id = :userId', { userId });
    } else {
      qb.leftJoinAndSelect('job.provider', 'provider')
        .leftJoinAndSelect('provider.profile', 'providerProfile')
        .andWhere('job.seeker_user_id = :userId', { userId });
    }

    if (query.status) {
      qb.andWhere('job.status = :status', { status: BOOKING_STATUS_FILTER_TO_JOB_STATUS[query.status] });
    }

    qb.orderBy('job.createdAt', 'DESC')
      .skip((query.page - 1) * query.limit)
      .take(query.limit);

    const [jobs, total] = await qb.getManyAndCount();
    const mapper = isProvider ? BookingListItemDto.fromProviderView : BookingListItemDto.fromSeekerView;
    return new PaginatedResponseDto(jobs.map(mapper), total, query.page, query.limit);
  }

  async findBookingDetail(
    userId: string,
    roles: string[],
    bookingId: string,
  ): Promise<BookingDetailDto> {
    const isProvider = roles.some((r) => r.toUpperCase() === 'PROVIDER');

    const qb = this.jobRepository
      .createQueryBuilder('job')
      .leftJoinAndSelect('job.seeker', 'seeker')
      .leftJoinAndSelect('seeker.profile', 'seekerProfile')
      .leftJoinAndSelect('job.provider', 'provider')
      .leftJoinAndSelect('provider.profile', 'providerProfile')
      .leftJoinAndSelect('job.category', 'category')
      .leftJoinAndSelect('job.photos', 'photos')
      .where('job.id = :bookingId', { bookingId })
      .andWhere('job.type = :type', { type: JobType.DIRECT });

    if (isProvider) {
      qb.andWhere('job.provider_user_id = :userId', { userId });
    } else {
      qb.andWhere('job.seeker_user_id = :userId', { userId });
    }

    const job = await qb.getOne();
    if (!job) throw new NotFoundException(`Booking "${bookingId}" not found`);

    const seekerId = (job.seeker as any).id as string;
    const providerId = (job.provider as any).id as string;
    const conversation = await this.conversationRepository.findOne({
      where: { seeker: { id: seekerId }, provider: { id: providerId } } as any,
      select: ['id'],
    });

    return BookingDetailDto.from(job, conversation?.id ?? null);
  }

  async updateStatus(providerUserId: string, bookingId: string, status: JobStatus): Promise<IdResponseDto> {
    return this.transition(providerUserId, bookingId, status, [JobStatus.PENDING]);
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────────

  private async transition(
    providerUserId: string,
    bookingId: string,
    nextStatus: JobStatus,
    allowedFrom: JobStatus[],
  ): Promise<IdResponseDto> {
    const job = await this.jobRepository.findOne({
      where: { id: bookingId, type: JobType.DIRECT, provider: { id: providerUserId } } as any,
      relations: { seeker: true },
    });
    if (!job) throw new NotFoundException(`Booking "${bookingId}" not found`);
    if (!allowedFrom.includes(job.status)) {
      throw new BadRequestException(
        `Booking cannot transition from "${job.status}" to "${nextStatus}"`,
      );
    }
    job.status = nextStatus;
    await this.jobRepository.save(job);

    this.eventEmitter.emit(
      new BookingStatusChangedEvent(bookingId, (job.seeker as any).id, providerUserId, nextStatus, providerUserId),
    );

    return { id: bookingId };
  }

  private async findDetailOrFail(bookingId: string): Promise<BookingDetailDto> {
    const job = await this.jobRepository.findOne({
      where: { id: bookingId },
      relations: ['seeker', 'seeker.profile', 'category', 'photos'],
    });
    if (!job) throw new NotFoundException(`Booking "${bookingId}" not found`);
    return BookingDetailDto.from(job);
  }
}
