import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ReportType } from '../../../database/common/enum';
import { ReportUserDto } from './report-user.dto';

export type ReportActionTaken = 'warning_sent' | 'dismissed' | 'resolved' | 'suspended';

export class ReportListItemDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ description: 'Human-readable report reference, e.g. RPT-482173' })
  reportRef!: string;

  @ApiProperty({ enum: ['pending', 'processed'] })
  status!: 'pending' | 'processed';

  @ApiPropertyOptional({ enum: ['warning_sent', 'dismissed', 'resolved', 'suspended'], nullable: true })
  action_taken!: ReportActionTaken | null;

  @ApiProperty({ enum: ReportType })
  reportKind!: ReportType;

  @ApiProperty()
  description!: string;

  @ApiProperty({ type: () => ReportUserDto })
  reporter!: ReportUserDto;

  @ApiPropertyOptional({ type: () => ReportUserDto, nullable: true })
  subjectUser!: ReportUserDto | null;

  @ApiPropertyOptional({ nullable: true, description: 'Warning thread ID for PDF download; null if no warning has been issued' })
  warningThreadId!: string | null;

  @ApiProperty()
  createdAt!: string;
}
