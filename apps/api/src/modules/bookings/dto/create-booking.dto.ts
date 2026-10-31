import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  MaxLength,
  IsOptional,
  IsUUID,
  IsEnum,
  IsInt,
  Min,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { EngagementType } from '../../../database/common/enum';

export class CreateBookingPhotoDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  fileUrl!: string;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

export class CreateBookingDto {
  /** The provider's profile id (from GET /api/providers) */
  @ApiProperty({ description: 'Provider profile id (from GET /api/providers list)' })
  @IsUUID('4')
  providerProfileId!: string;

  @ApiProperty({ maxLength: 2000 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  description!: string;

  @ApiPropertyOptional({ description: 'Category id (UUID)' })
  @IsOptional()
  @IsUUID('4')
  categoryId?: string;

  @ApiPropertyOptional({ maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  locationText?: string;

  @ApiProperty({ enum: EngagementType, description: 'single | short | long' })
  @IsEnum(EngagementType)
  engagement!: EngagementType;

  @ApiPropertyOptional({ description: 'Duration in months (only for short/long engagements)' })
  @IsOptional()
  @IsInt()
  @Min(1)
  durationMonths?: number;

  @ApiPropertyOptional({ type: [CreateBookingPhotoDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateBookingPhotoDto)
  photos?: CreateBookingPhotoDto[];
}
