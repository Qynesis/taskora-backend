import { IsUUID, IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Request DTO for creating a subscription checkout session for a selected job
 */
export class CreateSelectionCheckoutDto {
  @ApiProperty({
    description: 'Duration of the subscription in months',
    enum: [1, 3],
    example: 1,
  })
  @IsNotEmpty()
  @IsEnum([1, 3])
  durationMonths!: 1 | 3;
}
