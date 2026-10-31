import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { BidCreatedEvent } from '../../bids/events/bid-created.event';
import { ConversationService } from '../conversation.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Job } from '../../../database/entities/job.entity';

@Injectable()
export class BidPlacedHandler {
  private readonly logger = new Logger(BidPlacedHandler.name);

  constructor(
    private readonly conversationService: ConversationService,
    @InjectRepository(Job)
    private readonly jobRepository: Repository<Job>,
  ) {}

  @OnEvent(BidCreatedEvent.EVENT_NAME)
  async handle(event: BidCreatedEvent): Promise<void> {
    try {
      const job = await this.jobRepository.findOne({
        where: { id: event.jobId } as any,
        relations: { seeker: true },
      });
      if (!job) {
        this.logger.warn(`BidPlacedHandler: job ${event.jobId} not found`);
        return;
      }

      const seekerId = job.seeker.id;
      const defaultBody = `I've submitted a bid of $${Number(event.price).toFixed(2)} ${event.currency} on your job.`;
      const body = event.message?.trim() || defaultBody;

      await this.conversationService.sendBidMessage(
        seekerId,
        event.providerId,
        event.jobId,
        body,
      );
    } catch (err) {
      this.logger.error(`BidPlacedHandler error: ${(err as Error).message}`, (err as Error).stack);
    }
  }
}
