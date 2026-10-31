import {
  IsString,
  IsNotEmpty,
  MaxLength,
  IsOptional,
  IsInt,
  Min,
  IsEnum,
  IsArray,
  ValidateNested,
  IsUUID,
  IsDateString,
  Matches,
  IsNumber,
  IsBoolean,
  IsIn,
  ValidateIf,
  IsDefined,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ServiceDuration, ServiceFrequency, BillingPeriod } from '../../../database/common/enum';

const VALID_WEEKDAYS = [
  'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday',
];

const isSingleTask = (o: CreateJobDto) => o.serviceDuration === ServiceDuration.SINGLE_TASK;
const isOngoing = (o: CreateJobDto) => !!o.serviceDuration && o.serviceDuration !== ServiceDuration.SINGLE_TASK;
const needsTimeSlot = (o: CreateJobDto) =>
  (isSingleTask(o) && o.isFlexibleTime === false) || (isOngoing(o) && o.isFlexibleTime !== true);

export class CreateJobDto {
  // ── Core ──────────────────────────────────────────────────────────────────

  @ApiProperty({ example: 'Fix leaking kitchen sink', maxLength: 200 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title!: string;

  @ApiPropertyOptional({
    example: 'Water is dripping under the sink when the tap runs. Need someone this week.',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Category id (UUID)' })
  @IsOptional()
  @IsUUID('4')
  categoryId?: string;

  // ── Address ───────────────────────────────────────────────────────────────

  @ApiPropertyOptional({ example: '123 Example St, Sydney NSW 2000', maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  locationText?: string;

  // ── Service Duration ──────────────────────────────────────────────────────

  @ApiProperty({
    enum: ServiceDuration,
    description: 'single_task | 1_month | 3_months | 6_months',
  })
  @IsEnum(ServiceDuration)
  serviceDuration!: ServiceDuration;

  // ── Dates ─────────────────────────────────────────────────────────────────

  @ApiProperty({
    example: '2026-04-01',
    description: 'Service start date (YYYY-MM-DD). Required for all duration types.',
  })
  @IsDateString()
  startDate!: string;

  @ApiPropertyOptional({
    example: '2026-06-30',
    description: 'Service end date (YYYY-MM-DD). Required for 1_month / 3_months / 6_months.',
  })
  @ValidateIf(isOngoing)
  @IsNotEmpty()
  @IsDateString()
  endDate?: string;

  // ── Time Preference ───────────────────────────────────────────────────────

  @ApiPropertyOptional({
    description:
      'true = seeker is flexible on time (no slot required), false = provide startTime–endTime. ' +
      'Required for single-task jobs.',
  })
  @ValidateIf(isSingleTask)
  @IsDefined({ message: 'isFlexibleTime is required for a single-task job' })
  @IsBoolean()
  isFlexibleTime?: boolean;

  @ApiPropertyOptional({
    example: '09:00',
    description:
      'Time slot start (HH:MM, 24h). Required when isFlexibleTime is false (single-task) ' +
      'or for any ongoing engagement.',
  })
  @ValidateIf(needsTimeSlot)
  @IsNotEmpty()
  @Matches(/^\d{2}:\d{2}$/, { message: 'startTime must be in HH:MM format' })
  startTime?: string;

  @ApiPropertyOptional({
    example: '17:00',
    description: 'Time slot end (HH:MM, 24h). Required under the same conditions as startTime.',
  })
  @ValidateIf(needsTimeSlot)
  @IsNotEmpty()
  @Matches(/^\d{2}:\d{2}$/, { message: 'endTime must be in HH:MM format' })
  endTime?: string;

  // ── Frequency (ongoing only) ───────────────────────────────────────────────

  @ApiPropertyOptional({
    enum: ServiceFrequency,
    description:
      'Required for ongoing engagements. ' +
      '"daily" = every day of the week; "custom" = seeker picks specific days.',
  })
  @ValidateIf(isOngoing)
  @IsNotEmpty()
  @IsEnum(ServiceFrequency)
  frequency?: ServiceFrequency;

  @ApiPropertyOptional({
    example: ['monday', 'friday'],
    type: [String],
    description:
      'Required when frequency is "custom". Valid values: monday–sunday.',
  })
  @ValidateIf((o: CreateJobDto) => o.frequency === ServiceFrequency.CUSTOM)
  @IsNotEmpty({ message: 'scheduledDays must not be empty when frequency is custom' })
  @IsArray()
  @IsIn(VALID_WEEKDAYS, { each: true, message: 'Each day must be a valid weekday name' })
  scheduledDays?: string[];

  // ── Budget ────────────────────────────────────────────────────────────────

  @ApiPropertyOptional({
    example: 150,
    minimum: 30,
    description:
      'Budget amount in dollars (e.g. 150 = $150.00 AUD), minimum 30. For ongoing jobs this represents the rate per budgetPeriod.',
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(2, { message: 'Budget must be at least 2 AUD' })
  budgetPrice?: number;

  @ApiPropertyOptional({
    enum: BillingPeriod,
    description: 'Required for ongoing jobs when budgetPrice is provided.',
  })
  @ValidateIf((o: CreateJobDto) => isOngoing(o) && o.budgetPrice != null)
  @IsNotEmpty()
  @IsEnum(BillingPeriod)
  budgetPeriod?: BillingPeriod;

  // ── Total Hours (ongoing only) ─────────────────────────────────────────────

  @ApiPropertyOptional({
    example: 8,
    description: 'Hours per budgetPeriod cadence (ongoing jobs only).',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  totalHours?: number;

  @ApiPropertyOptional({
    enum: BillingPeriod,
    description: 'Required for ongoing jobs when totalHours is provided.',
  })
  @ValidateIf((o: CreateJobDto) => isOngoing(o) && o.totalHours != null)
  @IsNotEmpty()
  @IsEnum(BillingPeriod)
  totalHoursPeriod?: BillingPeriod;

  // ── Photos ────────────────────────────────────────────────────────────────

  @ApiPropertyOptional({
    type: () => [CreateJobPhotoDto],
    description:
      'Optional job photos. Upload to Azure Blob Storage first, then provide the public URLs.',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateJobPhotoDto)
  photos?: CreateJobPhotoDto[];
}

export class CreateJobPhotoDto {
  @ApiProperty({
    example: 'https://<account>.blob.core.windows.net/<container>/jobs/abc123/photo_1.jpg',
    description: 'Azure Blob Storage public URL.',
  })
  @IsString()
  @IsNotEmpty()
  fileUrl!: string;

  @ApiPropertyOptional({ example: 0, description: 'Display order; default is 0' })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}
