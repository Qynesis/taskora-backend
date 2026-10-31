import { IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CertificationStatus } from '../../../database/common/enum';

export class ReviewCertificationDto {
  @ApiProperty({ enum: [CertificationStatus.ACCEPTED, CertificationStatus.REJECTED] })
  @IsIn([CertificationStatus.ACCEPTED, CertificationStatus.REJECTED])
  status!: CertificationStatus;
}
