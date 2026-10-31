import { ApiProperty } from '@nestjs/swagger';
import { VerificationStatus } from '../../../database/common/enum';

export type ProviderStatus = 'active' | 'inactive' | 'suspended' | 'deleted';

export class AdminProviderListItemDto {
  @ApiProperty({ description: 'User UUID' })
  id!: string;

  @ApiProperty({ description: 'Full name or business name', nullable: true })
  name!: string | null;

  @ApiProperty({ description: 'Primary service category', nullable: true })
  category!: string | null;

  @ApiProperty({ description: 'Average rating (0–5)', nullable: true })
  rating!: number | null;

  @ApiProperty({
    enum: ['active', 'inactive', 'suspended', 'deleted'],
    description:
      'active: usable account. inactive: admin-deactivated (reversible). ' +
      'suspended: admin-suspended (soft-deleted). deleted: user-deleted / anonymized.',
  })
  status!: ProviderStatus;

  @ApiProperty({ description: 'Date the account was created' })
  joinedAt!: Date;

  @ApiProperty({ description: 'Total earnings (payments with status=succeeded)' })
  totalEarnings!: number;

  @ApiProperty({ description: 'Currency of total earnings', example: 'AUD' })
  currency!: string;

  @ApiProperty({ enum: VerificationStatus, description: 'Provider verification case status' })
  verificationStatus!: VerificationStatus;
}
