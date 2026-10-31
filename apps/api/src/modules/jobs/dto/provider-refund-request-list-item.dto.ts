import { ApiProperty } from '@nestjs/swagger';
import { RefundRequestReason, RefundRequestStatus } from '../../../database/common/enum';
import { money } from '../../../interfaces/money.util';

export class ProviderRefundRequestListItemDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  jobTitle!: string;

  @ApiProperty({ description: 'Full name of the seeker (client)' })
  clientName!: string;

  @ApiProperty({ enum: RefundRequestReason })
  reason!: RefundRequestReason;

  @ApiProperty({ description: 'Requested refund amount in dollars (AUD)' })
  amount!: number;

  @ApiProperty({ enum: RefundRequestStatus })
  status!: RefundRequestStatus;

  @ApiProperty()
  createdAt!: Date;

  static fromRaw(row: Record<string, any>): ProviderRefundRequestListItemDto {
    const dto = new ProviderRefundRequestListItemDto();
    dto.id = row['id'];
    dto.jobTitle = row['jobTitle'] ?? '';
    dto.clientName =
      [row['seekerFirstName'], row['seekerLastName']].filter(Boolean).join(' ') ||
      row['seekerEmail'] ||
      '';
    dto.reason = row['reason'];
    dto.amount = money(row['amount']);
    dto.status = row['status'];
    dto.createdAt = row['createdAt'];
    return dto;
  }
}
