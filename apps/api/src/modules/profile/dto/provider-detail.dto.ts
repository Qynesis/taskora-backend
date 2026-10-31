import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ProviderDetailEmployeeDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  designation!: string;

  @ApiProperty({ description: 'True when this entry represents the provider owner' })
  isOwner!: boolean;
}

export class ProviderDetailDto {
  @ApiProperty({ description: 'Provider profile id (same as profile.id)' })
  id!: string;

  @ApiPropertyOptional({ nullable: true })
  businessName!: string | null;

  @ApiPropertyOptional({ nullable: true })
  avatarUrl!: string | null;

  @ApiProperty({ type: [String] })
  categories!: string[];

  @ApiProperty({ type: [String], description: 'Skill names the provider has added to their professional details' })
  skills!: string[];

  @ApiPropertyOptional({ nullable: true })
  country!: string | null;

  @ApiProperty({ description: "True if the provider's verification case has been approved by an admin" })
  isVerified!: boolean;

  @ApiProperty({ description: 'True if at least one certification has been verified by an admin' })
  isCertified!: boolean;

  @ApiProperty()
  email!: string;

  @ApiPropertyOptional({ nullable: true })
  phone!: string | null;

  @ApiPropertyOptional({ nullable: true, description: 'About / bio' })
  bio!: string | null;

  // ─── Rates ────────────────────────────────────────────────────────────────────

  @ApiProperty()
  ratePerHourWeekday!: number;

  @ApiProperty()
  ratePerHourWeekend!: number;

  @ApiProperty()
  ratePerHourHoliday!: number;

  @ApiProperty()
  subscriptionRate1Month!: number;

  @ApiProperty()
  subscriptionRate3Months!: number;

  @ApiProperty()
  subscriptionRate6Months!: number;

  // ─── Stats ────────────────────────────────────────────────────────────────────

  @ApiProperty({ description: 'Average rating (0 if no reviews)' })
  avgRating!: number;

  @ApiProperty({ description: 'Total completed jobs' })
  jobsDone!: number;

  @ApiProperty({ description: 'Number of times rehired by a seeker who hired this provider before' })
  rehired!: number;

  @ApiPropertyOptional({ nullable: true, description: 'Job success rate as a percentage' })
  jobSuccessRate!: number | null;

  @ApiPropertyOptional({ nullable: true, description: 'Percentage of reviews where provider was recommended' })
  recommendationRate!: number | null;

  @ApiPropertyOptional({ nullable: true, description: 'Percentage of jobs delivered on time' })
  onTimeRate!: number | null;

  @ApiPropertyOptional({ nullable: true, description: 'Percentage of jobs delivered on budget' })
  onBudgetRate!: number | null;

  // ─── Employees ───────────────────────────────────────────────────────────────

  @ApiProperty({ type: [ProviderDetailEmployeeDto] })
  employees!: ProviderDetailEmployeeDto[];

  @ApiProperty({ description: 'Whether the requesting seeker has favourited this provider' })
  isFavourite!: boolean;
}
