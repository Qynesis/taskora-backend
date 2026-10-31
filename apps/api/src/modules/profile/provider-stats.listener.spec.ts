import { Test, TestingModule } from '@nestjs/testing';
import { getQueueToken } from '@nestjs/bullmq';
import { QUEUE_NAMES, ProviderStatsJobName } from '@app/shared-types';
import { ProviderStatsListener } from './provider-stats.listener';
import { JobStatusChangedEvent } from '../jobs/events/job-status-changed.event';
import { ReviewCreatedEvent } from '../reviews/events/review-created.event';
import { JobStatus } from '../../database/common/enum';

describe('ProviderStatsListener', () => {
  let listener: ProviderStatsListener;
  let queue: { add: jest.Mock };

  beforeEach(async () => {
    queue = { add: jest.fn().mockResolvedValue(undefined) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProviderStatsListener,
        { provide: getQueueToken(QUEUE_NAMES.PROVIDER_STATS), useValue: queue },
      ],
    }).compile();

    listener = module.get(ProviderStatsListener);
  });

  const jobEvent = (status: JobStatus, providerId: string | null = 'provider-1') =>
    new JobStatusChangedEvent('job-1', 'Fix the sink', status, 'seeker-1', providerId);

  describe('job status changes', () => {
    it.each([[JobStatus.COMPLETED], [JobStatus.CANCELLED]])(
      'should enqueue a recompute when a job becomes %s',
      async (status) => {
        await listener.onJobStatusChanged(jobEvent(status));

        expect(queue.add).toHaveBeenCalledTimes(1);
        const [name, payload] = queue.add.mock.calls[0];
        expect(name).toBe(ProviderStatsJobName.RECOMPUTE);
        expect(payload.providerUserId).toBe('provider-1');
      },
    );

    it.each([
      [JobStatus.POSTED],
      [JobStatus.BIDDING],
      [JobStatus.IN_PROGRESS],
      [JobStatus.SELECTED],
    ])('should NOT enqueue for non-terminal status %s', async (status) => {
      // Only completed/cancelled move the numbers — those are the two the rate counts.
      await listener.onJobStatusChanged(jobEvent(status));
      expect(queue.add).not.toHaveBeenCalled();
    });

    it('should NOT enqueue when the job has no provider', async () => {
      await listener.onJobStatusChanged(jobEvent(JobStatus.COMPLETED, null));
      expect(queue.add).not.toHaveBeenCalled();
    });
  });

  describe('reviews', () => {
    it('should enqueue a recompute when a review is created', async () => {
      await listener.onReviewCreated(new ReviewCreatedEvent('review-1', 'provider-9', 'seeker-1', 5));

      expect(queue.add).toHaveBeenCalledTimes(1);
      expect(queue.add.mock.calls[0][1].providerUserId).toBe('provider-9');
    });
  });

  describe('de-duplication', () => {
    it('should use a per-provider jobId so bursts collapse to one pending recompute', async () => {
      // Every recompute re-reads from source, so a second queued job for the same provider
      // would compute an identical result. Collapsing them keeps a burst of completions cheap.
      await listener.onJobStatusChanged(jobEvent(JobStatus.COMPLETED));

      const opts = queue.add.mock.calls[0][2];
      expect(opts.jobId).toBe('provider-stats:provider-1');
    });

    it('should give different providers different job ids', async () => {
      await listener.onJobStatusChanged(jobEvent(JobStatus.COMPLETED, 'p-1'));
      await listener.onJobStatusChanged(jobEvent(JobStatus.COMPLETED, 'p-2'));

      expect(queue.add.mock.calls[0][2].jobId).toBe('provider-stats:p-1');
      expect(queue.add.mock.calls[1][2].jobId).toBe('provider-stats:p-2');
    });
  });

  describe('resilience', () => {
    it('should swallow enqueue failures so the triggering action still succeeds', async () => {
      // Stale cached stats must never fail the job status change or the review that caused it.
      // The next event repairs them, because every recompute reads from source.
      queue.add.mockRejectedValue(new Error('redis is down'));

      await expect(listener.onJobStatusChanged(jobEvent(JobStatus.COMPLETED))).resolves.toBeUndefined();
    });

    it('should swallow enqueue failures from the review path too', async () => {
      queue.add.mockRejectedValue(new Error('redis is down'));

      await expect(
        listener.onReviewCreated(new ReviewCreatedEvent('r-1', 'p-1', 's-1', 4)),
      ).resolves.toBeUndefined();
    });
  });
});
