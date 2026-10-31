import { IsUUID, IsString, IsNotEmpty, IsOptional, IsBoolean, IsNumber, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
// Lookup
export class CheckoutPaymentDto {
  @ApiProperty({
    description: 'Job ID to pay for',
    example: '6c4d7fbc-3e9a-4c1a-9731-7b8cfd7d9f3a',
  })
  @IsUUID('4')
  jobId!: string;

  @ApiProperty({
    description: 'Stripe saved payment method ID (pm_xxx)',
    example: 'pm_1OqLts2eZvKYlo2CaYiXOQJk',
  })
  @IsString()
  @IsNotEmpty()
  paymentMethodId!: string;

  @ApiPropertyOptional({
    description: 'Save this payment method for future use',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  savePaymentMethod?: boolean;
}
