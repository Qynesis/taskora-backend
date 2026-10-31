import { IsString, IsNotEmpty, IsOptional, MaxLength, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';


export class CreateSelectionDto {
  @ApiProperty({
    example: 'e9f2a7f6-0b74-4d4b-9c5c-5f3c0f50a4d7',
    description: 'The ID of the bid being selected for this job.',
  })
  @IsUUID('4')
  bidId!: string;
}

