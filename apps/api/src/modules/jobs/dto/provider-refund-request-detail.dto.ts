import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RefundRequestReason, RefundRequestStatus } from '../../../database/common/enum';
import { RefundRequest } from '../../../database/entities/refund-request.entity';

// paymentId is included so the frontend can call POST /api/payments/{paymentId}/refund

class RefundRequestJobDto {
  @ApiProperty()
  title!: string;

  @ApiPropertyOptional()
  description?: string | null;

  @ApiPropertyOptional()
  locationText?: string | null;

  @ApiPropertyOptional({ example: 'Plumbing' })
  category?: string | null;
}

class RefundRequestClientDto {
  @ApiProperty()
  name!: string;

  @ApiProperty()
  email!: string;

  @ApiPropertyOptional()
  avatarUrl?: string | null;
}

export class ProviderRefundRequestDetailDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid', description: 'Pass this to POST /api/payments/{paymentId}/refund' })
  paymentId!: string;

  @ApiProperty({ type: RefundRequestJobDto })
  job!: RefundRequestJobDto;

  @ApiProperty({ type: RefundRequestClientDto })
  client!: RefundRequestClientDto;

  @ApiProperty({ enum: RefundRequestReason })
  reason!: RefundRequestReason;

  @ApiPropertyOptional({ description: 'Additional comments from the seeker' })
  comments?: string | null;

  @ApiProperty({ description: 'Requested refund amount in dollars (AUD)' })
  amount!: number;

  @ApiProperty({
    description: 'Settled amount that will actually be refunded to the seeker, in dollars (AUD). ' +
      'This is the full amount charged (single-task: contract total; subscription: sum of all collected cycles) — ' +
      'not a seeker-proposed figure. Funded by clawing back the provider transfer plus the platform commission.',
  })
  amountToBeRefunded!: number;

  @ApiProperty({ enum: RefundRequestStatus })
  status!: RefundRequestStatus;

  @ApiProperty({ type: [String], description: 'Evidence photo URLs uploaded by the seeker' })
  attachments!: string[];

  @ApiProperty()
  createdAt!: Date;

  static from(rr: RefundRequest): ProviderRefundRequestDetailDto {
    const dto = new ProviderRefundRequestDetailDto();

    dto.id = rr.id;
    dto.paymentId = rr.payment.id;

    dto.job = {
      title: rr.job.title ?? '',
      description: rr.job.description ?? null,
      locationText: rr.job.locationText ?? null,
      category: rr.job.category?.name ?? null,
    };

    const profile = rr.seeker.profile;
    dto.client = {
      name: [profile?.firstName, profile?.lastName].filter(Boolean).join(' ') || rr.seeker.email,
      email: rr.seeker.email,
      avatarUrl: profile?.avatarUrl ?? null,
    };

    dto.reason = rr.reason;
    dto.comments = rr.comments ?? null;
    dto.amount = rr.requestedAmount;
    // requestedAmount is server-computed as the full amount charged, so it is exactly what
    // Stripe will refund — surface it under an unambiguous key for the frontend.
    dto.amountToBeRefunded = rr.requestedAmount;
    dto.status = rr.status;

    dto.attachments = (rr.evidencePhotos ?? [])
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((p) => p.fileUrl);

    dto.createdAt = rr.createdAt;

    return dto;
  }
}
