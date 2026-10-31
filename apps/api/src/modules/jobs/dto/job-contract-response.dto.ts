import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { JobContract } from '../../../database/entities/job-contract.entity';
import { ContractPaymentFrequency } from '../../../database/common/enum';
import { money } from '../../../interfaces/money.util';

export class JobContractResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  jobId!: string;

  @ApiPropertyOptional({ example: 1200 })
  depositAmount?: number | null;

  @ApiProperty({ enum: ContractPaymentFrequency })
  paymentFrequency!: ContractPaymentFrequency;

  @ApiProperty()
  earlyTermination!: boolean;

  @ApiProperty()
  confidentialityClause!: boolean;

  @ApiPropertyOptional()
  additionalClause?: string | null;

  @ApiProperty()
  createdAt!: string;

  static from(contract: JobContract): JobContractResponseDto {
    const dto = new JobContractResponseDto();
    dto.id = contract.id;
    dto.jobId = (contract.job as any)?.id ?? (contract as any).jobId;
    dto.depositAmount = contract.depositAmount != null ? money(contract.depositAmount) : null;
    dto.paymentFrequency = contract.paymentFrequency;
    dto.earlyTermination = contract.earlyTermination;
    dto.confidentialityClause = contract.confidentialityClause;
    dto.additionalClause = contract.additionalClause ?? null;
    dto.createdAt = contract.createdAt.toISOString();
    return dto;
  }
}
