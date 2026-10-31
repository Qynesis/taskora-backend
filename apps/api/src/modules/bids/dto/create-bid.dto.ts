import { IsString, IsOptional, MaxLength, IsNumber, Min, Length } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBidDto {
  @ApiProperty({
    example: 125,
    description: 'Offered price in dollars (e.g., 125 = $125.00 AUD)',
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price!: number;

  @ApiPropertyOptional({
    example: 'Can do this tomorrow afternoon, includes parts and labor.',
    description: 'Optional opening message — sent as the first message in the conversation thread, not stored on the bid.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(10_000)
  message?: string;
}

