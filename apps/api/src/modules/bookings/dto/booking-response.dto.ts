import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { JobStatus, EngagementType } from '../../../database/common/enum';
import { Job } from '../../../database/entities/job.entity';

const toBookingStatus = (status: JobStatus): string =>
  status === JobStatus.SELECTED ? 'processed' : status;

export class BookingListItemDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ description: 'Seeker full name (populated for provider view)' })
  clientName!: string;

  @ApiProperty({ description: 'Provider full name (populated for seeker view)' })
  providerName!: string;

  @ApiPropertyOptional({ nullable: true })
  category!: string | null;

  @ApiProperty({ enum: EngagementType })
  engagement!: EngagementType;

  @ApiPropertyOptional({ nullable: true, description: 'Duration in months (when engagement is short/long)' })
  durationMonths!: number | null;

  @ApiProperty({ description: 'pending | processed | rejected | cancelled | completed' })
  status!: string;

  @ApiProperty()
  createdAt!: Date;

  static fromProviderView(job: Job): BookingListItemDto {
    const dto = new BookingListItemDto();
    dto.id = job.id;
    const p = job.seeker?.profile;
    dto.clientName = [p?.firstName, p?.lastName].filter(Boolean).join(' ') || job.seeker?.email || '';
    dto.providerName = '';
    dto.category = job.category?.name ?? null;
    dto.engagement = job.engagement;
    dto.durationMonths = job.durationMonths ?? null;
    dto.status = toBookingStatus(job.status);
    dto.createdAt = job.createdAt;
    return dto;
  }

  static fromSeekerView(job: Job): BookingListItemDto {
    const dto = new BookingListItemDto();
    dto.id = job.id;
    const p = job.provider?.profile;
    dto.providerName = [p?.firstName, p?.lastName].filter(Boolean).join(' ') || job.provider?.email || '';
    dto.clientName = '';
    dto.category = job.category?.name ?? null;
    dto.engagement = job.engagement;
    dto.durationMonths = job.durationMonths ?? null;
    dto.status = toBookingStatus(job.status);
    dto.createdAt = job.createdAt;
    return dto;
  }
}

export class BookingDetailDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  description!: string;

  @ApiPropertyOptional({ nullable: true })
  category!: string | null;

  @ApiProperty({ enum: EngagementType })
  engagement!: EngagementType;

  @ApiPropertyOptional({ nullable: true })
  durationMonths!: number | null;

  @ApiPropertyOptional({ nullable: true })
  locationText!: string | null;

  @ApiProperty({ description: 'pending | processed | rejected | cancelled | completed' })
  status!: string;

  @ApiProperty({ type: [Object] })
  photos!: { fileUrl: string; sortOrder: number }[];

  @ApiProperty({ description: 'Seeker user id — use as recipientId to start a conversation (provider view)', nullable: true })
  clientId!: string | null;

  @ApiProperty({ description: 'Seeker full name' })
  clientName!: string;

  @ApiPropertyOptional({ nullable: true })
  clientAvatarUrl!: string | null;

  @ApiProperty({ description: 'Provider user id — use as recipientId to start a conversation (seeker view)', nullable: true })
  providerId!: string | null;

  @ApiProperty({ description: 'Provider full name' })
  providerName!: string;

  @ApiPropertyOptional({ nullable: true })
  providerAvatarUrl!: string | null;

  @ApiPropertyOptional({ nullable: true, description: 'Conversation ID for inbox redirect; null if no conversation exists yet' })
  conversationId!: string | null;

  @ApiProperty()
  createdAt!: Date;

  static from(job: Job, conversationId: string | null = null): BookingDetailDto {
    const dto = new BookingDetailDto();
    dto.id = job.id;
    dto.description = job.description ?? '';
    dto.category = job.category?.name ?? null;
    dto.engagement = job.engagement;
    dto.durationMonths = job.durationMonths ?? null;
    dto.locationText = job.locationText ?? null;
    dto.status = toBookingStatus(job.status);
    dto.photos = (job.photos ?? [])
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((p) => ({ fileUrl: p.fileUrl, sortOrder: p.sortOrder }));
    const seekerProfile = job.seeker?.profile;
    dto.clientId = job.seeker?.id ?? null;
    dto.clientName = [seekerProfile?.firstName, seekerProfile?.lastName].filter(Boolean).join(' ') || job.seeker?.email || '';
    dto.clientAvatarUrl = seekerProfile?.avatarUrl ?? null;
    const providerProfile = job.provider?.profile;
    dto.providerId = job.provider?.id ?? null;
    dto.providerName = [providerProfile?.firstName, providerProfile?.lastName].filter(Boolean).join(' ') || job.provider?.email || '';
    dto.providerAvatarUrl = providerProfile?.avatarUrl ?? null;
    dto.conversationId = conversationId;
    dto.createdAt = job.createdAt;
    return dto;
  }
}
