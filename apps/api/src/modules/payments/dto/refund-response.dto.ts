import { ApiProperty } from '@nestjs/swagger';

export class RefundInitiatedResponseDto {
  @ApiProperty({ description: 'Stripe refund ID (re_xxx)' })
  stripeRefundId!: string;

  @ApiProperty({ description: 'Amount refunded in dollars (AUD)' })
  amount!: number;

  @ApiProperty({ description: 'Stripe refund status (succeeded, pending, failed)' })
  status!: string;
}
