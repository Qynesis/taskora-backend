import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { QUEUE_NAMES, ProviderStatsJobName, ProviderStatsJobPayload } from '@app/shared-types';
import { JobStatus } from '../../database/common/enum';
import { JobStatusChangedEvent } from '../jobs/events/job-status-changed.event';
import { ReviewCreatedEvent } from '../reviews/events/review-created.event';

/**
 * Enqueues a stats recompute whenever something that feeds the cached numbers changes.
 * The recompute itself runs in apps/worker — see ProviderStatsProcessor.
 *
 * Enqueue-only: the recompute must not run inline on the request thread, and must survive a
 * failure. Queueing also collapses bursts — several jobs completing for the same provider each
 * enqueue, and each recompute is a full recompute, so the later ones simply re-derive the same
 * answer rather than compounding.
 *
 * Failures here are swallowed. A provider's cached stats going stale must never fail the job
 * status change or the review that triggered it — the next event repairs it, because every
 * recompute reads from source rather than applying a delta.
 */
@Injectable()
export class ProviderStatsListener {
  private readonly logger = new Logger(ProviderStatsListener.name);

  constructor(
    @InjectQueue(QUEUE_NAMES.PROVIDER_STATS) private readonly queue: Queue,
  ) {}

  private async enqueue(providerUserId: string, reason: string): Promise<void> {
    const payload: ProviderStatsJobPayload = { providerUserId, reason };
    try {
      await this.queue.add(ProviderStatsJobName.RECOMPUTE, payload, {
        // One pending recompute per provider is enough: the job re-reads everything, so a
        // second queued job for the same provider would compute an identical result.
        jobId: `provider-stats:${providerUserId}`,
        removeOnComplete: true,
        removeOnFail: false,
      });
    } catch (error) {
      this.logger.warn(
        `Failed to enqueue stats recompute for provider ${providerUserId} (${reason}): ` +
          `${(error as Error).message}`,
      );
    }
  }

  @OnEvent(JobStatusChangedEvent.EVENT_NAME)
  async onJobStatusChanged(event: JobStatusChangedEvent): Promise<void> {
    // Only terminal statuses move the numbers — those are the two the rate counts.
    if (event.newStatus !== JobStatus.COMPLETED && event.newStatus !== JobStatus.CANCELLED) return;
    if (!event.providerId) return;

    await this.enqueue(event.providerId, `job ${event.jobId} -> ${event.newStatus}`);
  }

  @OnEvent(ReviewCreatedEvent.EVENT_NAME)
  async onReviewCreated(event: ReviewCreatedEvent): Promise<void> {
    await this.enqueue(event.providerId, `review ${event.reviewId} created`);
  }
}
