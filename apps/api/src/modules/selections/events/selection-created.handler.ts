import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { SelectionCreatedEvent } from './selection-created.event';

@Injectable()
export class SelectionCreatedHandler {
  private readonly logger = new Logger(SelectionCreatedHandler.name);

  @OnEvent(SelectionCreatedEvent.EVENT_NAME)
  handle(event: SelectionCreatedEvent): void {
    this.logger.log(
      `Selection created: id="${event.selectionId}", name="${event.name}", at=${event.occurredAt.toISOString()}`,
    );
  }
}
