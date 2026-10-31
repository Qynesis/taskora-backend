import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { UserSyncedEvent } from './user-synced.event';

@Injectable()
export class UserSyncedHandler {
  private readonly logger = new Logger(UserSyncedHandler.name);

  @OnEvent(UserSyncedEvent.EVENT_NAME)
  handle(event: UserSyncedEvent): void {
    const action = event.isNew ? 'created' : 'updated';
    this.logger.log(
      `User ${action}: id="${event.userId}", email="${event.email}", at=${event.occurredAt.toISOString()}`,
    );
  }
}
