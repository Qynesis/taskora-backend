import { IsString, IsArray, ArrayMaxSize, IsUUID, IsNumber, Min, ValidateNested, IsUrl, IsOptional, IsInt } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class MediaItemDto {
  @ApiProperty({ example: 'https://cdn.com/portfolio.jpg' })
  @IsUrl()
  url!: string;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional() @IsNumber() @Min(0)
  sortOrder?: number;
}

export class UpdateProfessionalDetailsDto {
  @ApiProperty({ example: ['uuid-category-1'] })
  @IsArray() @ArrayMaxSize(20) @IsUUID('4', { each: true })
  categoryIds!: string[];

  @ApiProperty({ example: ['uuid-skill-1'] })
  @IsArray() @ArrayMaxSize(50) @IsUUID('4', { each: true })
  skillIds!: string[];

  @ApiPropertyOptional({ example: 42.00, description: 'Per hour rate on weekdays' })
  @IsOptional() @IsNumber() @Min(0)
  ratePerHourWeekday?: number;

  @ApiPropertyOptional({ example: 45.00, description: 'Per hour rate on weekends' })
  @IsOptional() @IsNumber() @Min(0)
  ratePerHourWeekend?: number;

  @ApiPropertyOptional({ example: 47.00, description: 'Per hour rate on holidays' })
  @IsOptional() @IsNumber() @Min(0)
  ratePerHourHoliday?: number;

  @ApiPropertyOptional({ example: 40.00, description: 'Subscription rate for 1 month' })
  @IsOptional() @IsNumber() @Min(0)
  subscriptionRate1Month?: number;

  @ApiPropertyOptional({ example: 35.00, description: 'Subscription rate for 3 months' })
  @IsOptional() @IsNumber() @Min(0)
  subscriptionRate3Months?: number;

  @ApiPropertyOptional({ example: 30.00, description: 'Subscription rate for 6 months' })
  @IsOptional() @IsNumber() @Min(0)
  subscriptionRate6Months?: number;

  @ApiPropertyOptional({ example: 'Bachelor of Engineering' })
  @IsOptional() @IsString()
  education?: string;

  @ApiPropertyOptional({ example: 5, description: 'Years of experience (number only)' })
  @IsOptional() @IsInt() @Min(0)
  yearsOfExperience?: number;

  @ApiPropertyOptional({ example: 'We offer professional plumbing services.' })
  @IsOptional() @IsString()
  bio?: string;

  @ApiPropertyOptional({ type: [MediaItemDto] })
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => MediaItemDto)
  attachments?: MediaItemDto[];
}
