import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class UpdateBidDto {
  @ApiPropertyOptional({ example: 125, description: 'Revised offered price in dollars (e.g. 125 = $125.00 AUD)' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price?: number;

  @ApiPropertyOptional({ example: 'Updated my offer — now includes parts and labour.', description: 'Optional message sent to the seeker via conversation' })
  @IsOptional()
  @IsString()
  @MaxLength(10_000)
  message?: string;
}
