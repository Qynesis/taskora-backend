import { ApiPropertyOptional } from '@nestjs/swagger';
import { ReportListItemDto } from './report-list-item.dto';

export class ReportDetailDto extends ReportListItemDto {
  @ApiPropertyOptional({ nullable: true })
  dismissedReason!: string | null;

  @ApiPropertyOptional({ nullable: true })
  resolvedAt!: string | null;

  @ApiPropertyOptional({ nullable: true, description: 'Warning message sent to user' })
  warningMessage!: string | null;

  @ApiPropertyOptional({ nullable: true, description: 'When the warning was sent' })
  warnedAt!: string | null;

  @ApiPropertyOptional({ nullable: true, description: '14-day deadline to resolve before suspension' })
  suspensionDeadline!: string | null;
}
