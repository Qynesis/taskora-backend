import { IsOptional, IsString, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { BaseQueryDto } from '../../../interfaces/base-query.dto';

export class CategoryQueryDto extends BaseQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description:
      'When true, /names returns only the client-curated featured categories in their fixed display order, ignoring search and pagination.',
    example: true,
  })
  @IsOptional()
  // Query strings arrive as text; accept the common truthy spellings and coerce anything else to
  // false so a stray value can't accidentally enable the featured set.
  @Transform(({ value }) => value === true || value === 'true' || value === '1')
  @IsBoolean()
  featured?: boolean;
}
