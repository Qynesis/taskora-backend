import { ApiProperty } from "@nestjs/swagger";
import { Exclude, Expose } from "class-transformer";
import { IsNotEmpty, IsString } from "class-validator";

// Create customer response dto
@Exclude()
export class CreateCustomerResponseDto{

    @ApiProperty({
        description: 'Stripe customer ID',
        example: 'cus_Pq3xY7ZaB9cD1e',
    })
    @Expose()
    @IsNotEmpty()
    @IsString()
    customer_id!: string;
}

// Get customer status response dto
@Exclude()
export class GetCustomerStatusResponseDto {
  @ApiProperty({ description: 'The Stripe Customer ID', example: 'cus_Pq3xY7ZaB9cD1e' })
  @Expose()
  customerId!: string;

  @ApiProperty({ description: 'The email registered with Stripe', example: 'seeker@example.com', nullable: true })
  @Expose()
  email?: string | null;

  @ApiProperty({ description: 'The name registered with Stripe', example: 'John Doe', nullable: true })
  @Expose()
  name?: string | null;

  @ApiProperty({ description: 'Indicates if the user has a default payment method attached' })
  @Expose()
  hasDefaultPaymentMethod!: boolean;
}