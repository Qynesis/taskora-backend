import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty } from 'class-validator';

/**
 * DTO for setting a payment card as default or non-default
 */
export class SetDefaultCardDto {
  @ApiProperty({
    description: 'Whether this card should be set as the default payment method',
    example: true,
  })
  @IsNotEmpty()
  @IsBoolean()
  is_default!: boolean;
}
