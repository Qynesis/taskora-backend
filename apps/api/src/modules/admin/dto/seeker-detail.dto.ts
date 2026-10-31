import { ApiProperty } from '@nestjs/swagger';
import { SeekerListItemDto } from './seeker-list-item.dto';

export type ActivityType = 'job_posted' | 'payment' | 'rating_given';

export class RecentJobActivityDto {
  @ApiProperty({ enum: ['job_posted', 'payment', 'rating_given'], description: 'Type of activity' })
  type!: ActivityType;

  @ApiProperty({ description: 'Human-readable activity title' })
  title!: string;
}

export class SeekerDetailDto extends SeekerListItemDto {
  @ApiProperty({ description: 'Phone number from profile', nullable: true })
  phone!: string | null;

  @ApiProperty({ description: 'Recent activity (jobs posted, payments, ratings)', type: () => RecentJobActivityDto, isArray: true })
  recentActivity!: RecentJobActivityDto[];
}
