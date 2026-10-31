import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { BidCreatedEvent } from './bid-created.event';

@Injectable()
export class BidCreatedHandler {
  private readonly logger = new Logger(BidCreatedHandler.name);

  @OnEvent(BidCreatedEvent.EVENT_NAME)
  handle(event: BidCreatedEvent): void {
    this.logger.log(
      `Bid created: id="${event.bidId}", jobId="${event.jobId}", providerId="${event.providerId}", at=${event.occurredAt.toISOString()}`,
    );
  }
}
