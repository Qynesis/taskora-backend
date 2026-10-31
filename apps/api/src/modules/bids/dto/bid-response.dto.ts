import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Bid } from '../../../database/entities/bid.entity';
import { BidStatus, ServiceDuration } from '../../../database/common/enum';
import { money } from '../../../interfaces/money.util';


export class ProviderSummaryDto {
  @ApiProperty()
  id!: string;

  /** Provider's registered business name */
  @ApiProperty({ example: 'New Star Plumbing' })
  name!: string;

  @ApiProperty({ example: 'john@example.com' })
  email!: string;

  @ApiPropertyOptional({ example: '+61 400 000 000' })
  phone?: string | null;

  @ApiPropertyOptional()
  avatarUrl?: string | null;

  @ApiProperty({ example: 4.8 })
  avgRating!: number;
}

export class JobSummaryDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  title!: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiPropertyOptional({ example: 'Parramatta, NSW' })
  location?: string;

  @ApiPropertyOptional({ enum: ServiceDuration })
  serviceDuration?: ServiceDuration | null;

  @ApiProperty()
  isLongTerm!: boolean;

  @ApiPropertyOptional({ example: 'Plumbing' })
  category?: string | null;
}

export class BidResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty({ description: 'Offered price' })
  offerPrice!: number;

  @ApiProperty({ example: 'AUD' })
  currency!: string;

  @ApiProperty({ enum: BidStatus })
  status!: BidStatus;

  @ApiProperty({ type: () => ProviderSummaryDto })
  provider!: ProviderSummaryDto;

  @ApiProperty({ type: () => JobSummaryDto })
  job!: JobSummaryDto;

  @ApiPropertyOptional({ description: 'Conversation ID between seeker and provider, null if no conversation started' })
  conversationId!: string | null;

  @ApiProperty({ description: 'Number of unread messages from the provider in this conversation' })
  unreadMessageCount!: number;

  static from(bid: Bid, provider: ProviderSummaryDto, conversationId: string | null = null, unreadMessageCount = 0): BidResponseDto {
    const dto = new BidResponseDto();
    dto.id = bid.id;
    dto.createdAt = bid.createdAt;
    dto.offerPrice = money(bid.price);
    dto.currency = bid.currency;
    dto.status = bid.status;
    dto.provider = provider;

    const j = bid.job;
    const jobSummary = new JobSummaryDto();
    jobSummary.id = j.id;
    jobSummary.title = j.title ?? '';
    jobSummary.description = j.description ?? undefined;
    jobSummary.location = j.locationText || undefined;
    jobSummary.serviceDuration = j.serviceDuration ?? null;
    jobSummary.isLongTerm = j.serviceDuration !== ServiceDuration.SINGLE_TASK;
    jobSummary.category = j.category?.name ?? null;
    dto.job = jobSummary;

    dto.conversationId = conversationId;
    dto.unreadMessageCount = unreadMessageCount;

    return dto;
  }
}
