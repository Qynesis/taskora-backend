import { ApiProperty } from '@nestjs/swagger';

/**
 * Response DTO for subscription checkout session creation
 */
export class SelectionCheckoutSessionResponseDto {
  @ApiProperty({
    description: 'Stripe Checkout Session URL to redirect the seeker to',
    example: 'https://checkout.stripe.com/pay/cs_...',
  })
  url!: string;

  @ApiProperty({
    description: 'Stripe Checkout Session ID',
    example: 'cs_test_...',
  })
  sessionId!: string;
}
