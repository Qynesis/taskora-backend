import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CertificationStatus } from '../../../database/common/enum';

export class CertificationDetailDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ description: 'Certification or license name' })
  name!: string;

  @ApiPropertyOptional({ nullable: true })
  licenseNumber!: string | null;

  @ApiPropertyOptional({ nullable: true })
  licenseType!: string | null;

  @ApiPropertyOptional({ nullable: true })
  state!: string | null;

  @ApiPropertyOptional({ nullable: true })
  postcode!: string | null;

  @ApiProperty({ enum: CertificationStatus })
  status!: CertificationStatus;

  @ApiProperty()
  isVerified!: boolean;

  @ApiProperty({ description: 'Date the certification was submitted' })
  submittedOn!: Date;
}
