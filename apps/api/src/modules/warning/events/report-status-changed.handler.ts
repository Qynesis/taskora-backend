import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { ReportStatusChangedEvent } from '../../reports/events/report-status-changed.event';
import { ReportStatus } from '../../../database/common/enum';
import { WarningThreadService } from '../warning-thread.service';

@Injectable()
export class ReportStatusChangedHandler {
  private readonly logger = new Logger(ReportStatusChangedHandler.name);

  constructor(private readonly warningThreadService: WarningThreadService) {}

  @OnEvent(ReportStatusChangedEvent.EVENT_NAME)
  async handle(event: ReportStatusChangedEvent): Promise<void> {
    this.logger.log(`Report status changed: reportId="${event.reportId}" status="${event.newStatus}"`);
    // RESOLVED is triggered by closeThread() which already closes the thread directly
    if (event.newStatus !== ReportStatus.RESOLVED) {
      await this.warningThreadService.closeByReportId(event.reportId);
    }
  }
}
