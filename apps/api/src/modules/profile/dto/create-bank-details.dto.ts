import { IsString, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBankDetailsDto {
  @ApiProperty({ example: 'Commonwealth Bank' })
  @IsString() @MaxLength(200)
  bankName!: string;

  @ApiProperty({ example: '123456789' })
  @IsString() @MaxLength(100)
  accountNumber!: string;

  @ApiPropertyOptional({ example: '062-000' })
  @IsOptional() @IsString() @MaxLength(50)
  bsbNumber?: string;

  @ApiProperty({ example: 'John Doe' })
  @IsString() @MaxLength(200)
  accountHolderName!: string;
}
