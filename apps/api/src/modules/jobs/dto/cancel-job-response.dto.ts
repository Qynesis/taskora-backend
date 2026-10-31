import { ApiProperty } from '@nestjs/swagger';

export class CancelJobResponseDto {
  @ApiProperty({ description: 'Job UUID', example: 'd28f3f64-ecd7-4eb7-b68e-180ff17135f5' })
  id!: string;

  @ApiProperty({ description: 'Administrative cancellation fee deducted (dollars)', example: 10 })
  cancellationFee!: number;

  @ApiProperty({ description: 'Amount refunded to the seeker (dollars); 0 if no payment was made', example: 90 })
  refundedAmount!: number;

  @ApiProperty({ description: 'Currency code', example: 'AUD' })
  currency!: string;
}
