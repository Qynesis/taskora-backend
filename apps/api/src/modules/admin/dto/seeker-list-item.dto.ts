import { ApiProperty } from '@nestjs/swagger';

export type SeekerStatus = 'active' | 'inactive' | 'suspended' | 'deleted';

export class SeekerListItemDto {
  @ApiProperty({ description: 'User UUID' })
  id!: string;

  @ApiProperty({ description: 'Full name (first + last from profile)', nullable: true })
  name!: string | null;

  @ApiProperty({ description: 'Email address' })
  email!: string;

  @ApiProperty({
    enum: ['active', 'inactive', 'suspended', 'deleted'],
    description:
      'active: usable account. inactive: admin-deactivated (reversible). ' +
      'suspended: admin-suspended (soft-deleted). deleted: user-deleted / anonymized.',
  })
  status!: SeekerStatus;

  @ApiProperty({ description: 'Total jobs posted by this seeker' })
  totalJobs!: number;

  @ApiProperty({ description: 'Date the account was created' })
  joinedAt!: Date;
}
