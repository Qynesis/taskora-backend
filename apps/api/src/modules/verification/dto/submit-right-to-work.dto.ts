import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsUrl, ValidateIf } from 'class-validator';
import { CitizenDocumentType, RightToWorkStatus } from '../../../database/common/enum';

export class SubmitRightToWorkDto {
  @ApiProperty({ enum: RightToWorkStatus })
  @IsEnum(RightToWorkStatus)
  rightToWorkStatus!: RightToWorkStatus;

  // ── Citizen / PR branch ───────────────────────────────────────────────────

  @ApiPropertyOptional({
    enum: CitizenDocumentType,
    description: 'Required when rightToWorkStatus is CITIZEN_PR',
  })
  @ValidateIf(o => o.rightToWorkStatus === RightToWorkStatus.CITIZEN_PR)
  @IsEnum(CitizenDocumentType)
  citizenDocumentType?: CitizenDocumentType;

  @ApiPropertyOptional({ description: 'Required when rightToWorkStatus is CITIZEN_PR — the selected citizen document' })
  @ValidateIf(o => o.rightToWorkStatus === RightToWorkStatus.CITIZEN_PR)
  @IsUrl({ require_protocol: true })
  fileUrl?: string;

  // ── Visa branch ───────────────────────────────────────────────────────────

  @ApiPropertyOptional({ description: 'Required when rightToWorkStatus is VISA — passport document' })
  @ValidateIf(o => o.rightToWorkStatus === RightToWorkStatus.VISA)
  @IsUrl({ require_protocol: true })
  passportFileUrl?: string;

  @ApiPropertyOptional({ description: 'Required when rightToWorkStatus is VISA — VEVO check document' })
  @ValidateIf(o => o.rightToWorkStatus === RightToWorkStatus.VISA)
  @IsUrl({ require_protocol: true })
  vevoFileUrl?: string;
}
