import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min, Max, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class DashboardChartsQueryDto {
  @ApiProperty({
    description: 'Year for chart data (4-digit, defaults to current year)',
    example: 2026,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1900)
  @Max(2999)
  year?: number;
}
