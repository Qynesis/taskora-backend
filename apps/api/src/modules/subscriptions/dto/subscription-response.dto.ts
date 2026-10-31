import { ApiProperty } from "@nestjs/swagger";
import { Exclude, Expose } from "class-transformer";
import { IsNotEmpty, IsString } from "class-validator";

// Subscription checkout session response dto
@Exclude()
export class SubscriptionCheckoutResponseDto{

    @Expose()
    @ApiProperty({
        description: 'subscription checkout url',
        example: 'https://checkout.stripe.com/c/pay/ac.....xyz'
    })
    @IsNotEmpty()
    @IsString()
    checkout_url!: string;

    @Expose()
    @ApiProperty({
        description: 'subscription checkout session id',
        example: 'cs_test_a1IpBOM6Yzu3nqgN9n2nBjYchIB9cRdGoc0ivHULzYVBdTv7Vt4j5YQKum'
    })
    @IsNotEmpty()
    @IsString()
    session_id!: string;
}

@Exclude()
export class SubscriptionDetailsResponseDto {
    @Expose()
    @ApiProperty({ example: 'sub_1N6f....' })
    @IsNotEmpty()
    @IsString()
    id!: string;

    @Expose()
    @ApiProperty({ example: 'active' })
    @IsNotEmpty()
    @IsString()
    status!: string;

    @Expose()
    @ApiProperty({ example: true })
    cancel_at_period_end!: boolean;
}

@Exclude()
export class SubscriptionPeriodResponseDto {
    @Expose()
    @ApiProperty({ example: 'sub_1N6f....' })
    @IsNotEmpty()
    @IsString()
    subscription_id!: string;

    @Expose()
    @ApiProperty({ example: 'active' })
    @IsNotEmpty()
    @IsString()
    status!: string;

    @Expose()
    @ApiProperty({ example: '2026-04-01T00:00:00.000Z' })
    @IsNotEmpty()
    @IsString()
    current_period_start!: string;

    @Expose()
    @ApiProperty({ example: '2026-05-01T00:00:00.000Z' })
    @IsNotEmpty()
    @IsString()
    current_period_end!: string;

    @Expose()
    @ApiProperty({ example: false })
    cancel_at_period_end!: boolean;
}

@Exclude()
export class SubscriptionCancellationResponseDto {
    @Expose()
    @ApiProperty({ example: 'sub_1N6f....' })
    @IsNotEmpty()
    @IsString()
    subscription_id!: string;

    @Expose()
    @ApiProperty({ example: 'active' })
    @IsNotEmpty()
    @IsString()
    status!: string;

    @Expose()
    @ApiProperty({ example: true })
    cancel_at_period_end!: boolean;

    @Expose()
    @ApiProperty({ example: 'SERVICE_QUALITY_NOT_MET', nullable: true })
    cancellation_reason!: string | null;

    @Expose()
    @ApiProperty({ example: 'Subscription will be canceled at the end of the current billing period.' })
    @IsNotEmpty()
    @IsString()
    message!: string;
}