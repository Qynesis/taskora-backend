import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationService } from '../notification.service';
import { NotificationType } from '../../../database/common/enum';
import { ReportStatusChangedEvent } from '../../reports/events/report-status-changed.event';
import { UserReport } from '../../../database/entities/user-report.entity';

@Injectable()
export class ReportResolvedNotificationHandler {
  private readonly logger = new Logger(ReportResolvedNotificationHandler.name);

  constructor(
    private readonly notificationService: NotificationService,
    @InjectRepository(UserReport)
    private readonly reportRepository: Repository<UserReport>,
  ) {}

  @OnEvent(ReportStatusChangedEvent.EVENT_NAME)
  async handle(event: ReportStatusChangedEvent): Promise<void> {
    try {
      const report = await this.reportRepository.findOne({
        where: { id: event.reportId } as any,
        relations: { reporter: true } as any,
      });
      if (!report) return;

      await this.notificationService.send({
        userId: (report.reporter as any).id,
        title: 'Report processed',
        body: 'Your report has been reviewed and processed. Thank you for keeping the platform safe.',
        type: NotificationType.REPORT_RESOLVED,
        data: { reportId: event.reportId, status: event.newStatus },
      });
    } catch (err) {
      this.logger.error('Failed to send report-resolved notification', err);
    }
  }
}
