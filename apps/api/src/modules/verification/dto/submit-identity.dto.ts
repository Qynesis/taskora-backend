import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsUrl, ValidateIf } from 'class-validator';
import { IdentityType } from '../../../database/common/enum';

export class SubmitIdentityDto {
  @ApiProperty({ enum: IdentityType, example: IdentityType.PASSPORT })
  @IsEnum(IdentityType)
  identityType!: IdentityType;

  // Front/primary document — required for both passport and driving licence.
  @ApiProperty({
    description: 'Front / primary document — required for both PASSPORT and DRIVING_LICENSE',
    example: 'https://cdn.example.com/dl-front.jpg',
  })
  @IsUrl({ require_protocol: true })
  frontUrl!: string;

  // Back of the document — required only for a (two-sided) driving licence.
  @ApiPropertyOptional({
    description: 'Back of the licence — required only when identityType is DRIVING_LICENSE',
    example: 'https://cdn.example.com/dl-back.jpg',
  })
  @ValidateIf(o => o.identityType === IdentityType.DRIVING_LICENSE)
  @IsUrl({ require_protocol: true })
  backUrl?: string;
}
