import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CertificationStatus } from '../../../database/common/enum';

export class CertificationListItemDto {
  @ApiProperty({ description: 'Certification ID' })
  id!: string;

  @ApiProperty({ description: 'Provider user ID' })
  providerId!: string;

  @ApiPropertyOptional({ description: 'Provider avatar URL', nullable: true })
  providerAvatarUrl!: string | null;

  @ApiProperty({ description: 'Provider full name' })
  providerName!: string;

  @ApiProperty({ enum: CertificationStatus })
  status!: CertificationStatus;

  @ApiProperty({ description: 'Date the certification was submitted' })
  submittedOn!: Date;
}
