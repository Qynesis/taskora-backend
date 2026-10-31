import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';

/**
 * Response DTO for the add card endpoint.
 * Frontend redirects the user to checkout_url; Stripe handles card entry.
 */
@Exclude()
export class AddCardResponseDto {
  @ApiProperty({
    description: 'Stripe Checkout URL to redirect the user to for entering card details',
    example: 'https://checkout.stripe.com/c/pay/cs_test_xxx',
  })
  @Expose()
  checkout_url!: string;

  @ApiProperty({
    description: 'Stripe Checkout Session ID for tracking',
    example: 'cs_test_xxx',
  })
  @Expose()
  session_id!: string;
}
