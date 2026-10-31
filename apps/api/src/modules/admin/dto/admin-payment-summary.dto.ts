import { ApiProperty } from '@nestjs/swagger';

export class AdminPaymentSummaryDto {
  @ApiProperty({ description: 'Sum of platform fees across all payment movements (excludes GST)', example: 4200 })
  platformRevenue!: number;

  @ApiProperty({ description: 'GST collected across all payment movements (remitted to the ATO, not revenue)', example: 3500 })
  gstCollected!: number;

  @ApiProperty({ description: 'Number of payment money movements (each single-task charge and each subscription cycle)', example: 38 })
  totalTransactions!: number;

  @ApiProperty({ description: 'Total amount refunded across all refunds', example: 300 })
  totalRefunded!: number;

  @ApiProperty({ example: 'AUD' })
  currency!: string;
}
