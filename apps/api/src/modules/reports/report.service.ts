import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserReport } from '../../database/entities/user-report.entity';
import { User } from '../../database/entities/user.entity';
import { UserWarning } from '../../database/entities/user-warning.entity';
import { WarningThread } from '../../database/entities/warning-thread.entity';
import { Selection } from '../../database/entities/selection.entity';
import { CreateReportDto } from './dto/create-report.dto';
import { UpdateReportAdminDto } from './dto/update-report-admin.dto';
import { SendWarningAdminDto } from './dto/send-warning-admin.dto';
import { ReportQueryDto } from './dto/report-query.dto';
import { ReportListItemDto, ReportActionTaken } from './dto/report-list-item.dto';
import { ReportDetailDto } from './dto/report-detail.dto';
import { ReportUserDto } from './dto/report-user.dto';
import { ReportableUserDto } from './dto/reportable-user.dto';
import { PaginatedResponseDto } from '../../interfaces/paginated-response.dto';
import { paginateQuery } from '../../interfaces/paginate-query.util';
import { ReportableUserQueryDto } from './dto/reportable-user-query.dto';
import { TransactionHelper } from '../../database/transaction.helper';
import { DomainEventEmitter } from '../../events/domain-event-emitter.service';
import { ReportCreatedEvent } from './events/report-created.event';
import { ReportWarningSentEvent } from './events/report-warning-sent.event';
import { ReportStatusChangedEvent } from './events/report-status-changed.event';
import { ReportStatus, ReportTargetType, UserRole } from '../../database/common/enum';
import { WarningThreadService } from '../warning/warning-thread.service';

@Injectable()
export class ReportService {
  constructor(
    @InjectRepository(UserReport)
    private readonly reportRepository: Repository<UserReport>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserWarning)
    private readonly warningRepository: Repository<UserWarning>,
    @InjectRepository(WarningThread)
    private readonly warningThreadRepository: Repository<WarningThread>,
    private readonly txHelper: TransactionHelper,
    private readonly eventEmitter: DomainEventEmitter,
    private readonly warningThreadService: WarningThreadService,
  ) {}

  async create(dto: CreateReportDto, reporterUserId: string): Promise<UserReport> {
    const reportRef = `RPT-${Math.floor(100000 + Math.random() * 900000)}`;

    const entity = await this.txHelper.run(async (qr) => {
      const record = qr.manager.create(UserReport, {
        reportRef,
        targetType: ReportTargetType.USER,
        targetId: dto.subjectUserId,
        subjectUser: { id: dto.subjectUserId },
        reporter: { id: reporterUserId },
        reportKind: dto.reportKind,
        description: dto.description,
        attachments: (dto.attachments ?? []) as unknown[],
      });
      return await qr.manager.save(record);
    });

    this.eventEmitter.emit(new ReportCreatedEvent(entity.id, entity.targetId, reporterUserId));

    return entity;
  }

  async findAll(query: ReportQueryDto): Promise<PaginatedResponseDto<ReportListItemDto>> {
    const pagination = paginateQuery<UserReport>(query);

    const qb = this.reportRepository
      .createQueryBuilder('r')
      .leftJoinAndSelect('r.reporter', 'reporter')
      .leftJoinAndSelect('reporter.profile', 'reporterProfile')
      .leftJoinAndSelect('r.subjectUser', 'subjectUser')
      .leftJoinAndSelect('subjectUser.profile', 'subjectProfile');

    if (query.status === 'pending') {
      qb.andWhere('r.status = :status', { status: ReportStatus.PENDING });
    } else if (query.status === 'processed') {
      qb.andWhere('r.status != :status', { status: ReportStatus.PENDING });
    }

    if (query.reporterRole) {
      qb.andWhere('reporter.role = :reporterRole', { reporterRole: query.reporterRole });
    }

    if (query.month !== undefined) {
      qb.andWhere(
        `EXTRACT(MONTH FROM r.created_at) = :month AND EXTRACT(YEAR FROM r.created_at) = :year`,
        { month: query.month, year: new Date().getFullYear() },
      );
    }

    qb.orderBy(`r.${query.sortBy}`, query.order)
      .skip(pagination.skip)
      .take(pagination.take);

    const [data, total] = await qb.getManyAndCount();

    const reportIds = data.map((r) => r.id);
    const threadByReportId = new Map<string, string>();
    if (reportIds.length > 0) {
      const rows: { reportId: string; threadId: string }[] = await this.warningThreadRepository
        .createQueryBuilder('wt')
        .innerJoin('wt.warning', 'uw')
        .select('wt.id', 'threadId')
        .addSelect('uw.report_id', 'reportId')
        .where('uw.report_id IN (:...reportIds)', { reportIds })
        .getRawMany();
      rows.forEach((row) => threadByReportId.set(row.reportId, row.threadId));
    }

    const items = data.map((r) => this.toListItem(r, threadByReportId.get(r.id) ?? null));
    return new PaginatedResponseDto(items, total, query.page, query.limit);
  }

  async findOne(id: string): Promise<ReportDetailDto> {
    const record = await this.reportRepository.findOne({
      where: { id } as any,
      relations: {
        reporter: { profile: true },
        subjectUser: { profile: true },
      },
    });
    if (!record) {
      throw new NotFoundException(`Report with id "${id}" not found`);
    }
    return this.toDetail(record);
  }

  async updateAdmin(id: string, dto: UpdateReportAdminDto, actorId?: string): Promise<ReportDetailDto> {
    const record = await this.reportRepository.findOne({
      where: { id } as any,
      relations: {
        reporter: { profile: true },
        subjectUser: { profile: true },
      },
    });
    if (!record) {
      throw new NotFoundException(`Report with id "${id}" not found`);
    }
    if (dto.status === ReportStatus.DISMISSED && !dto.dismissedReason) {
      throw new BadRequestException('dismissedReason is required when dismissing a report');
    }
    if (dto.status !== undefined) record.status = dto.status;
    if (dto.dismissedReason !== undefined) record.dismissedReason = dto.dismissedReason;
    const saved = await this.reportRepository.save(record);
    this.eventEmitter.emit(new ReportStatusChangedEvent(id, dto.status, actorId));
    return this.toDetail(saved);
  }

  async markAsSuspended(reportId: string, actorId?: string): Promise<void> {
    const record = await this.reportRepository.findOne({ where: { id: reportId } as any });
    if (!record) return;
    record.status = ReportStatus.SUSPENDED;
    await this.reportRepository.save(record);
    this.eventEmitter.emit(new ReportStatusChangedEvent(reportId, ReportStatus.SUSPENDED, actorId));
  }

  async markAsResolved(reportId: string, actorId?: string): Promise<void> {
    const record = await this.reportRepository.findOne({ where: { id: reportId } as any });
    if (!record) return;
    record.status = ReportStatus.RESOLVED;
    await this.reportRepository.save(record);
    this.eventEmitter.emit(new ReportStatusChangedEvent(reportId, ReportStatus.RESOLVED, actorId));
  }

  async sendWarning(reportId: string, dto: SendWarningAdminDto, adminId: string): Promise<ReportDetailDto> {
    const record = await this.reportRepository.findOne({
      where: { id: reportId } as any,
      relations: {
        reporter: { profile: true },
        subjectUser: { profile: true },
      },
    });
    if (!record) {
      throw new NotFoundException(`Report "${reportId}" not found`);
    }
    if (!record.subjectUser) {
      throw new BadRequestException('Report has no subject user to warn');
    }
    if (record.status !== ReportStatus.PENDING) {
      throw new BadRequestException(`Cannot send warning on a report with status "${record.status}"`);
    }

    const warnedAt = new Date();
    const suspensionDeadline = new Date(warnedAt.getTime() + 14 * 24 * 60 * 60 * 1000);

    record.status = ReportStatus.WARNING_SENT;
    record.warningMessage = dto.warningMessage;
    record.warnedAt = warnedAt;
    record.suspensionDeadline = suspensionDeadline;

    const { savedWarning } = await this.txHelper.run(async (qr) => {
      await qr.manager.save(record);
      const warning = qr.manager.create(UserWarning, {
        recipient: { id: record.subjectUser!.id },
        report: { id: record.id },
        message: dto.warningMessage,
        suspensionDeadline,
      });
      const savedWarning = await qr.manager.save(warning);
      return { savedWarning };
    });

    const { thread } = await this.warningThreadService.createForWarning(
      savedWarning.id,
      record.subjectUser.id,
      adminId,
      dto.warningMessage,
    );

    this.eventEmitter.emit(
      new ReportWarningSentEvent(
        record.subjectUser.id,
        savedWarning.id,
        thread.id,
        dto.warningMessage,
        record.reportRef,
        suspensionDeadline,
        adminId,
      ),
    );

    return this.toDetail(record);
  }

  /**
   * Returns a paginated list of users the current user can report.
   *
   * Only users connected via a completed Selection are shown:
   * - Seeker → providers they hired (selections.selected_by_user_id = me)
   * - Provider → seekers who hired them (selections.provider_user_id = me)
   */
  async findReportableUsers(
    currentUserId: string,
    query: ReportableUserQueryDto,
  ): Promise<PaginatedResponseDto<ReportableUserDto>> {
    const currentUser = await this.userRepository.findOneBy({ id: currentUserId } as any);
    if (!currentUser) {
      throw new NotFoundException(`User not found`);
    }

    const isSeeker = currentUser.role === UserRole.SEEKER;

    const joinCondition = isSeeker
      ? 'sel.selected_by_user_id = :currentUserId AND sel.provider_user_id = u.id'
      : 'sel.provider_user_id = :currentUserId AND sel.selected_by_user_id = u.id';

    const qb = this.userRepository
      .createQueryBuilder('u')
      .leftJoinAndSelect('u.profile', 'profile')
      .innerJoin(Selection, 'sel', joinCondition, { currentUserId })
      .andWhere('u.isActive = true')
      .groupBy('u.id')
      .addGroupBy('profile.id');

    if (query.search?.trim()) {
      const term = `%${query.search.trim().toLowerCase()}%`;
      qb.andWhere(
        `(LOWER(profile.first_name) LIKE :term
          OR LOWER(profile.last_name) LIKE :term
          OR LOWER(CONCAT(COALESCE(profile.first_name,''), ' ', COALESCE(profile.last_name,''))) LIKE :term
          OR LOWER(u.email) LIKE :term)`,
        { term },
      );
    }

    qb.orderBy('u.createdAt', query.order)
      .skip((query.page - 1) * query.limit)
      .take(query.limit);

    const [data, total] = await qb.getManyAndCount();

    const items: ReportableUserDto[] = data.map((u) => {
      const firstName = u.profile?.firstName ?? '';
      const lastName = u.profile?.lastName ?? '';
      const label = [firstName, lastName].filter(Boolean).join(' ') || u.email;
      return { value: u.id, label };
    });

    return new PaginatedResponseDto(items, total, query.page, query.limit);
  }

  // ---------------------------------------------------------------------------
  // Mappers
  // ---------------------------------------------------------------------------

  private toUserDto(user: User | null | undefined): ReportUserDto | null {
    if (!user) return null;
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt.toISOString(),
      firstName: user.profile?.firstName ?? null,
      lastName: user.profile?.lastName ?? null,
      avatarUrl: user.profile?.avatarUrl ?? null,
    };
  }

  private toListItem(r: UserReport, warningThreadId: string | null = null): ReportListItemDto {
    const ACTION_MAP: Partial<Record<ReportStatus, ReportActionTaken>> = {
      [ReportStatus.WARNING_SENT]: 'warning_sent',
      [ReportStatus.DISMISSED]: 'dismissed',
      [ReportStatus.RESOLVED]: 'resolved',
      [ReportStatus.SUSPENDED]: 'suspended',
    };
    return {
      id: r.id,
      reportRef: r.reportRef,
      status: r.status === ReportStatus.PENDING ? 'pending' : 'processed',
      action_taken: ACTION_MAP[r.status] ?? null,
      reportKind: r.reportKind,
      description: r.description,
      reporter: this.toUserDto(r.reporter) as ReportUserDto,
      subjectUser: this.toUserDto(r.subjectUser),
      warningThreadId,
      createdAt: r.createdAt.toISOString(),
    };
  }

  private toDetail(r: UserReport): ReportDetailDto {
    return {
      ...this.toListItem(r),
      dismissedReason: r.dismissedReason ?? null,
      resolvedAt: r.resolvedAt?.toISOString() ?? null,
      warningMessage: r.warningMessage ?? null,
      warnedAt: r.warnedAt?.toISOString() ?? null,
      suspensionDeadline: r.suspensionDeadline?.toISOString() ?? null,
    };
  }
}
