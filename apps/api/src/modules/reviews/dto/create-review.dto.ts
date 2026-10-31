import { IsUUID, IsInt, Min, Max, IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateReviewDto {
  @ApiProperty({ example: 'uuid-of-job' })
  @IsUUID('4')
  jobId!: string;

  @ApiProperty({ example: 5, minimum: 1, maximum: 5 })
  @IsInt() @Min(1) @Max(5)
  rating!: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional() @IsBoolean()
  deliveredOnBudget?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional() @IsBoolean()
  deliveredOnTime?: boolean;

  @ApiPropertyOptional({ example: 'Highly recommended!' })
  @IsOptional() @IsString() @MaxLength(150)
  title?: string;

  @ApiPropertyOptional({ example: 'Great work, very professional.' })
  @IsOptional() @IsString() @MaxLength(2000)
  comment?: string;
}
