import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { ContractPaymentFrequency } from '../../../database/common/enum';

export class CreateJobContractDto {
  @ApiPropertyOptional({ description: 'Deposit amount to be paid before work commences', example: 1200 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  depositAmount?: number | null;

  @ApiProperty({ enum: ContractPaymentFrequency, description: 'How often the provider will be paid' })
  @IsEnum(ContractPaymentFrequency)
  paymentFrequency!: ContractPaymentFrequency;

  @ApiProperty({ description: 'Whether either party can end the contract early (14-day written notice applies)' })
  @IsBoolean()
  earlyTermination!: boolean;

  @ApiProperty({ description: "Provider's duty not to reveal confidential seeker information", default: true })
  @IsBoolean()
  confidentialityClause!: boolean;

  @ApiPropertyOptional({ description: 'Optional additional clause text' })
  @IsOptional()
  @IsString()
  additionalClause?: string | null;
}
