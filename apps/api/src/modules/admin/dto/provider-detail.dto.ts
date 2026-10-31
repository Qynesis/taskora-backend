import { ApiProperty } from '@nestjs/swagger';
import { AdminProviderListItemDto } from './provider-list-item.dto';

export type ProviderActivityType = 'payment_received' | 'job_completed' | 'bid_accepted';

export class ProviderRecentActivityDto {
  @ApiProperty({ enum: ['payment_received', 'job_completed', 'bid_accepted'] })
  type!: ProviderActivityType;

  @ApiProperty({ description: 'Human-readable activity title' })
  title!: string;
}

export class AdminProviderDetailDto extends AdminProviderListItemDto {
  @ApiProperty({ description: 'Email address' })
  email!: string;

  @ApiProperty({ description: 'Phone number from profile', nullable: true })
  phone!: string | null;

  @ApiProperty({
    description: "Provider's date of birth (YYYY-MM-DD). Needed for Stripe KYC; admin verifies it before approving identity.",
    example: '1988-04-23',
    nullable: true,
  })
  dateOfBirth!: string | null;

  @ApiProperty({ description: 'Recent provider activity', type: () => ProviderRecentActivityDto, isArray: true })
  recentActivity!: ProviderRecentActivityDto[];
}
