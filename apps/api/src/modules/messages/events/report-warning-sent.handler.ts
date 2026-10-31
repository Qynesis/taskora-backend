import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { ReportWarningSentEvent } from '../../reports/events/report-warning-sent.event';
import { ChatGateway } from '../chat.gateway';

@Injectable()
export class ReportWarningSentHandler {
  private readonly logger = new Logger(ReportWarningSentHandler.name);

  constructor(private readonly chatGateway: ChatGateway) {}

  @OnEvent(ReportWarningSentEvent.EVENT_NAME)
  handle(event: ReportWarningSentEvent): void {
    this.logger.log(`Warning sent: warningId="${event.warningId}", recipient="${event.recipientUserId}"`);
    this.chatGateway.broadcastToUser(event.recipientUserId, {
      threadId: event.threadId,
      warningId: event.warningId,
      message: event.message,
      reportRef: event.reportRef,
      suspensionDeadline: event.suspensionDeadline.toISOString(),
    });
  }
}
