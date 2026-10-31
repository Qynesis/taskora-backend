import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { VerificationCreatedEvent } from './verification-created.event';

@Injectable()
export class VerificationCreatedHandler {
  private readonly logger = new Logger(VerificationCreatedHandler.name);

  @OnEvent(VerificationCreatedEvent.EVENT_NAME)
  handle(event: VerificationCreatedEvent): void {
    this.logger.log(
      `Verification created: id="${event.verificationId}", name="${event.name}", at=${event.occurredAt.toISOString()}`,
    );
  }
}
