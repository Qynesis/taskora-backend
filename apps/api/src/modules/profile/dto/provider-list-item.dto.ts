import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ProviderListItemDto {
  @ApiProperty()
  id!: string;

  @ApiPropertyOptional({ description: 'Business name from work info', nullable: true })
  name!: string | null;

  @ApiPropertyOptional({ nullable: true })
  avatarUrl!: string | null;

  @ApiPropertyOptional()
  state!: string;

  @ApiProperty()
  ratePerHourWeekday!: number;

  @ApiPropertyOptional({ type: [String], nullable: true })
  skills!: string[] | null;

  @ApiProperty({ description: 'Average rating (0 if no reviews)' })
  avgRating!: number;

  @ApiProperty({ type: [String] })
  categories!: string[];

  @ApiPropertyOptional({
    nullable: true,
    description: 'Job success rate as a percentage. Null if never assigned a job.',
  })
  jobSuccessRate!: number | null;

  @ApiProperty({ description: 'Whether the seeker has favourited this provider' })
  isFavourite!: boolean;
}

export class PublicProviderListItemDto {
  @ApiProperty()
  id!: string;

  @ApiPropertyOptional({ description: 'Business name from work info', nullable: true })
  name!: string | null;

  @ApiPropertyOptional({ nullable: true })
  avatarUrl!: string | null;

  @ApiPropertyOptional()
  state!: string;

  @ApiProperty()
  ratePerHourWeekday!: number;

  @ApiPropertyOptional({ type: [String], nullable: true })
  skills!: string[] | null;

  @ApiProperty({ description: 'Average rating (0 if no reviews)' })
  avgRating!: number;

  @ApiPropertyOptional({ nullable: true, description: 'Primary service category' })
  category!: string | null;

  @ApiPropertyOptional({ nullable: true, description: 'Job success rate as a percentage. Null if never assigned a job.' })
  jobSuccessRate!: number | null;
}
