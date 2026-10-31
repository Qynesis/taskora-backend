import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { JobCreatedEvent } from './job-created.event';

@Injectable()
export class JobCreatedHandler {
  private readonly logger = new Logger(JobCreatedHandler.name);

  @OnEvent(JobCreatedEvent.EVENT_NAME)
  handle(event: JobCreatedEvent): void {
    this.logger.log(
      `Job created: id="${event.jobId}", name="${event.name}", at=${event.occurredAt.toISOString()}`,
    );
  }
}
