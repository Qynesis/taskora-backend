import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsString, ValidateNested, IsArray, IsNumber } from 'class-validator';

export class MonthlyRevenueDto {
  @ApiProperty({ description: 'Month name (Jan, Feb, ..., Dec)', example: 'Jan' })
  @IsString()
  month!: string;

  @ApiProperty({ description: 'Monthly revenue amount in dollars', example: 5000 })
  @IsNumber()
  value!: number;
}

export class JobsOverviewDto {
  @ApiProperty({ description: 'Month name (Jan, Feb, ..., Dec)', example: 'Jan' })
  @IsString()
  month!: string;

  @ApiProperty({ description: 'Number of completed jobs in the month', example: 350000 })
  @IsInt()
  completed!: number;

  @ApiProperty({ description: 'Number of active jobs in the month', example: 150000 })
  @IsInt()
  active!: number;
}

export class RevenueChartDto {
  @ApiProperty({ description: 'Year for which data is requested', example: 2026 })
  @IsInt()
  year!: number;

  @ApiProperty({
    description: '12-month array of platform revenue in chronological order',
    type: [MonthlyRevenueDto],
  })
  @ValidateNested({ each: true })
  @Type(() => MonthlyRevenueDto)
  @IsArray()
  monthlyRevenue!: MonthlyRevenueDto[];

  @ApiProperty({
    description: 'Year-over-year revenue change percentage (e.g., 12.9 for +12.9%)',
    example: 12.9,
    type: 'number',
  })
  @IsNumber()
  revenueChangePercent!: number;
}

export class JobsChartDto {
  @ApiProperty({ description: 'Year for which data is requested', example: 2026 })
  @IsInt()
  year!: number;

  @ApiProperty({
    description: '12-month array of completed vs active jobs in chronological order',
    type: [JobsOverviewDto],
  })
  @ValidateNested({ each: true })
  @Type(() => JobsOverviewDto)
  @IsArray()
  jobsOverview!: JobsOverviewDto[];

  @ApiProperty({
    description: 'Year-over-year completed jobs change percentage (e.g., 12.9 for +12.9%)',
    example: 12.9,
    type: 'number',
  })
  @IsNumber()
  jobChangePercent!: number;
}
