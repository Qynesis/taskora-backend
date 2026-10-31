import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { ReportCreatedEvent } from './report-created.event';

@Injectable()
export class ReportCreatedHandler {
  private readonly logger = new Logger(ReportCreatedHandler.name);

  @OnEvent(ReportCreatedEvent.EVENT_NAME)
  handle(event: ReportCreatedEvent): void {
    this.logger.log(
      `Report created: id="${event.reportId}", name="${event.name}", at=${event.occurredAt.toISOString()}`,
    );
  }
}
