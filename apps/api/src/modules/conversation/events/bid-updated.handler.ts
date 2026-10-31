import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { BidUpdatedEvent } from '../../bids/events/bid-updated.event';
import { ConversationService } from '../conversation.service';

@Injectable()
export class BidUpdatedHandler {
  private readonly logger = new Logger(BidUpdatedHandler.name);

  constructor(private readonly conversationService: ConversationService) {}

  @OnEvent(BidUpdatedEvent.EVENT_NAME)
  async handle(event: BidUpdatedEvent): Promise<void> {
    try {
      const defaultBody = `I've updated my bid to $${Number(event.price).toFixed(2)} ${event.currency}.`;
      const body = event.message?.trim() || defaultBody;

      await this.conversationService.sendBidMessage(
        event.seekerId,
        event.providerId,
        event.jobId,
        body,
      );
    } catch (err) {
      this.logger.error(`BidUpdatedHandler error: ${(err as Error).message}`, (err as Error).stack);
    }
  }
}
