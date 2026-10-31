import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { ProfileCreatedEvent } from './profile-created.event';

@Injectable()
export class ProfileCreatedHandler {
  private readonly logger = new Logger(ProfileCreatedHandler.name);

  @OnEvent(ProfileCreatedEvent.EVENT_NAME)
  handle(event: ProfileCreatedEvent): void {
    this.logger.log(
      `Profile created: id="${event.profileId}", name="${event.name}", at=${event.occurredAt.toISOString()}`,
    );
  }
}
