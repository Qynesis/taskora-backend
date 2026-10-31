import { Logger } from '@nestjs/common';
import { WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';

/**
 * Abstract base class for BullMQ processors.
 *
 * Provides structured logging on job start, success, and failure.
 * Subclasses implement `process(job)` with their specific logic.
 */
export abstract class BaseProcessor extends WorkerHost {
  protected abstract readonly logger: Logger;

  async run(job: Job): Promise<void> {
    this.logger.log(`Processing job ${job.id} (${job.name})`);

    try {
      await this.process(job);
      this.logger.log(`Job ${job.id} (${job.name}) completed successfully`);
    } catch (error) {
      const isRetryable = this.isRetryable(error);
      this.logger.error(
        `Job ${job.id} (${job.name}) failed (retryable: ${isRetryable}): ${
          error instanceof Error ? error.message : String(error)
        }`,
        error instanceof Error ? error.stack : undefined,
      );

      if (!isRetryable) {
        // Move directly to failed state without further retries
        await job.moveToFailed(
          error instanceof Error ? error : new Error(String(error)),
          job.token ?? '',
          false,
        );
        return;
      }

      throw error; // Let BullMQ handle retries
    }
  }

  abstract process(job: Job): Promise<void>;

  /**
   * Override in subclasses to define which errors should be retried.
   * By default, all errors are considered retryable.
   */
  protected isRetryable(_error: unknown): boolean {
    return true;
  }
}
