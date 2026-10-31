import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Exclude, Expose } from "class-transformer";
import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID } from "class-validator";
import { money } from '../../../interfaces/money.util';

// Onbarding link
@Exclude()
export class OnboardingLinkResponseDto{

    @ApiProperty({
        description: 'The secure Stripe Connect onboarding URL to redirect the user to.',
        example: 'https://connect.stripe.com/setup/s/acct_1Hh9xyz...',
    })
    @Expose()
    @IsNotEmpty()
    @IsString()
    url!: string;
}

// Connect status
@Exclude()
export class ConnectStatusResponseDto{
    @ApiProperty({
        description: 'Stripe connect account ID',
        example: 'acct_1Hh9xyz...'
    })
    @Expose()
    @IsNotEmpty()
    @IsString()
    accountId!: string;

    @ApiProperty({
        description: 'Whether the user has submitted all required details'
    })
    @Expose()
    @IsNotEmpty()
    @IsBoolean()
    detailsSubmitted!: boolean;

    @ApiProperty({ 
        description: 'Whether the account is allowed to process charges' 
    })
    @Expose()
    @IsNotEmpty()
    @IsBoolean()
    chargesEnabled!: boolean;

    @ApiProperty({ 
        description: 'Whether the account is allowed to receive payouts' 
    })
    @Expose()
    @IsNotEmpty()
    @IsBoolean()
    payoutsEnabled!: boolean;

    @ApiProperty({ 
        description: 'List of requirements that are currently due to enable capabilities',
        type: [String],
        example: ['individual.verification.document', 'external_account']
    })
    @Expose()
    currentlyDue!: string[];

    @ApiProperty({ 
        description: 'List of requirements that will eventually be due',
        type: [String]
    })
    @Expose()
    eventuallyDue!: string[];
}

// payment checkout response
@Exclude()
export class PaymentCheckoutResponseDto{
    @ApiProperty({
        description: 'Stripe client secret',
        example: 'pi_3PoX2tLkdIwHu7ix1L8vG9aK_secret_a1b2c3d4e5f6g7h8i9j0k1l2m'
    })
    @Expose()
    @IsNotEmpty()
    @IsString()
    client_secret!: string;

    @ApiProperty({
        description: 'Stripe payment intent id',
        example: 'pi_3PoX2tLkdIwHu7ix1L8vG9aK'
    })
    @Expose()
    @IsNotEmpty()
    @IsString()
    payment_intent_id!: string;
}

// get payment details
@Exclude()
export class PaymentDetailsResponseDto {
    @ApiProperty({
        description: 'Stripe payment intent id',
        example: 'pi_3PoX2tLkdIwHu7ix1L8vG9aK'
    })
    @Expose()
    @IsNotEmpty()
    @IsString()
    id!: string;

    @ApiProperty({
        description: 'Payment amount in dollars',
        example: 100
    })
    @Expose()
    @IsNotEmpty()
    @IsNumber()
    amount!: number;

    @ApiProperty({
        description: 'Three-letter ISO currency code, in lowercase',
        example: 'aud'
    })
    @Expose()
    @IsNotEmpty()
    @IsString()
    currency!: string;

    @ApiProperty({
        description: 'Current status of the payment intent (e.g., succeeded, processing, requires_payment_method)',
        example: 'succeeded'
    })
    @Expose()
    @IsNotEmpty()
    @IsString()
    status!: string;

    @ApiProperty({
        description: 'Time at which the object was created (Unix timestamp in seconds)',
        example: 1682345678
    })
    @Expose()
    @IsNotEmpty()
    @IsNumber()
    created!: number;

    @ApiProperty({
        description: 'Stripe customer ID associated with the payment',
        example: 'cus_P1x2Y3z4A5b6C7'
    })
    @Expose()
    @IsNotEmpty()
    @IsString()
    customer!: string;

    @ApiPropertyOptional({
        description: 'Stripe connected account ID of the provider (retrieved from metadata)',
        example: 'acct_1N2b3c4d5e6f'
    })
    @Expose()
    @IsOptional()
    @IsString()
    provider?: string;
}

// unified job checkout response (single-task and long-term both return this)
export class JobCheckoutResponseDto {
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

    @ApiProperty({
        description: 'Type of checkout: "one_time" (single-task job) or "subscription" (long-term job — deposit is bundled into the first subscription invoice)',
        example: 'subscription',
        enum: ['one_time', 'subscription'],
    })
    checkoutType!: 'one_time' | 'subscription';
}

// saved card response dto
@Exclude()
export class SavedCardResponseDto{

    @Expose()
    @ApiProperty({
        description: 'ID of the payment method',
        example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
    })
    @IsNotEmpty()
    @IsUUID()
    card_id!: string;

    @Expose()
    @ApiProperty({
        description: 'card brand',
        example: 'visa'
    })
    @IsNotEmpty()
    @IsString()
    card_brand!: string;

    @Expose()
    @ApiProperty({
        description: 'last 4 digit',
        example: '4356'
    })
    @IsNotEmpty()
    @IsString()
    last4!: string;

    @Expose()
    @ApiProperty({
        description: 'expire date',
        example: '12/26'
    })
    @IsNotEmpty()
    @IsString()
    expires!: string;

    @Expose()
    @ApiProperty({
        description: 'mark the card as default',
        example: true
    })
    @IsNotEmpty()
    @IsBoolean()
    is_default_card!: boolean;

}

export class ProviderPaymentListItemDto {
    @ApiProperty({ description: 'Payment ID' })
    id!: string;

    @ApiPropertyOptional({ description: 'Job ID (null for subscription payments)', nullable: true })
    jobId!: string | null;

    @ApiProperty({ description: 'Job title (null for direct bookings)', nullable: true })
    jobTitle!: string | null;

    @ApiProperty({ description: 'Seeker full name or email', example: 'Jane Smith' })
    clientName!: string;

    @ApiProperty({ description: 'Net amount received by provider (dollars)', example: 97 })
    amount!: number;

    @ApiProperty({ description: 'Currency code', example: 'AUD' })
    currency!: string;

    @ApiProperty({ enum: ['paid', 'pending', 'refunded'], description: 'Provider-facing payment status' })
    status!: string;

    @ApiPropertyOptional({ description: 'Invoice PDF URL — present only when status is paid, null otherwise', nullable: true })
    invoiceUrl!: string | null;

    @ApiPropertyOptional({ description: 'Refund record ID — present only when status is refunded, null otherwise', nullable: true })
    refundId!: string | null;

    @ApiProperty({ description: 'Payment date' })
    createdAt!: Date;

    static from(p: any): ProviderPaymentListItemDto {
        const dto = new ProviderPaymentListItemDto();
        dto.id = p.id;
        dto.jobId = p.job?.id ?? null;
        dto.jobTitle = p.job?.title ?? null;
        const profile = p.seeker?.profile;
        const fullName = [profile?.firstName, profile?.lastName].filter(Boolean).join(' ');
        dto.clientName = fullName || p.seeker?.email || '';
        dto.amount = money(p.providerPayout ?? 0);
        dto.currency = p.currency;
        dto.status = p.status === 'succeeded' ? 'paid' : p.status;
        dto.invoiceUrl = p.status === 'succeeded' ? (p.invoiceUrl ?? null) : null;
        dto.refundId = p.refundId ?? null;
        dto.createdAt = p.createdAt;
        return dto;
    }
}

export class ProviderEarningsSummaryDto {
    @ApiProperty({ description: 'Total amount earned from succeeded payments (dollars)', example: 1250 })
    totalEarnings!: number;

    @ApiProperty({ description: 'Total amount pending settlement (dollars)', example: 200 })
    totalPending!: number;

    @ApiProperty({ description: 'Total amount refunded (dollars)', example: 50 })
    totalRefunded!: number;

    @ApiProperty({ description: 'Currency code', example: 'AUD' })
    currency!: string;
}