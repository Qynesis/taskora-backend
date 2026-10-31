import { ApiProperty } from '@nestjs/swagger';

export class AdminTransactionListItemDto {
  @ApiProperty({ description: 'Payment or refund UUID' })
  transactionId!: string;

  @ApiProperty({ enum: ['payment', 'refund'] })
  type!: 'payment' | 'refund';

  @ApiProperty({ description: 'Full name or email of the seeker who initiated payment' })
  senderName!: string;

  @ApiProperty()
  senderEmail!: string;

  @ApiProperty()
  amount!: number;

  @ApiProperty({ example: 'AUD' })
  currency!: string;

  @ApiProperty()
  date!: Date;
}
