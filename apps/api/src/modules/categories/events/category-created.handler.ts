import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { CategoryCreatedEvent } from './category-created.event';

@Injectable()
export class CategoryCreatedHandler {
  private readonly logger = new Logger(CategoryCreatedHandler.name);

  @OnEvent(CategoryCreatedEvent.EVENT_NAME)
  handle(event: CategoryCreatedEvent): void {
    this.logger.log(
      `Category created: id="${event.categoryId}", name="${event.name}", at=${event.occurredAt.toISOString()}`,
    );
  }
}
