import { IsUUID, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CheckoutSubscriptionDto {
  @ApiProperty({
    description: 'Job ID to initiate subscription payment for',
    example: '6c4d7fbc-3e9a-4c1a-9731-7b8cfd7d9f3a',
  })
  @IsUUID('4')
  @IsNotEmpty()
  jobId!: string;
}
