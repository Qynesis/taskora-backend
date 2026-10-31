import { IsEnum, IsString, MinLength, ValidateIf } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ReportStatus } from '../../../database/common/enum';

export class UpdateReportAdminDto {
  @ApiProperty({ enum: [ReportStatus.DISMISSED], description: 'Only DISMISSED is accepted here; WARNING_SENT and SUSPENDED are set by their dedicated endpoints' })
  @IsEnum([ReportStatus.DISMISSED])
  status!: ReportStatus.DISMISSED;

  @ApiPropertyOptional({ description: 'Required when status is dismissed' })
  @ValidateIf((o: UpdateReportAdminDto) => o.status === ReportStatus.DISMISSED)
  @IsString()
  @MinLength(10)
  dismissedReason?: string;
}
