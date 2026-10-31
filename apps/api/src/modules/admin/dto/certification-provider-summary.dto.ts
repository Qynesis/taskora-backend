import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CertificationStatus } from '../../../database/common/enum';

export class CertificationProviderSummaryDto {
  @ApiProperty({ description: 'Provider user ID' })
  providerId!: string;

  @ApiProperty({ description: 'Provider full name' })
  providerName!: string;

  @ApiPropertyOptional({ description: 'Provider avatar URL', nullable: true })
  providerAvatarUrl!: string | null;

  @ApiProperty({ description: 'Most recent certification submission date' })
  submittedOn!: Date;

  @ApiProperty({ enum: CertificationStatus, description: 'Status of the most recently submitted certification' })
  status!: CertificationStatus;
}
