import { sleep } from '@shared/utils';
import { RateLimitedQueue } from '@infrastructure/adapters/queue/rate-limited-queue';

describe('RateLimitedQueue - Rate Limiting Tests', () => {
  describe('Rate Limiting Enforcement', () => {
    it('should enforce minimum delay between consecutive tasks', async () => {
      const delayMs = 500;
      const queue = new RateLimitedQueue<number>(delayMs);
      const executionTimes: number[] = [];

      const promises = [
        queue.enqueue(async () => { executionTimes.push(Date.now()); return 1; }),
        queue.enqueue(async () => { executionTimes.push(Date.now()); return 2; }),
        queue.enqueue(async () => { executionTimes.push(Date.now()); return 3; }),
      ];

      await Promise.all(promises);

      expect(executionTimes).toHaveLength(3);

      // Check delay between first and second task
      const delay1to2 = executionTimes[1] - executionTimes[0];
      expect(delay1to2).toBeGreaterThanOrEqual(delayMs - 150);

      // Check delay between second and third task
      const delay2to3 = executionTimes[2] - executionTimes[1];
      expect(delay2to3).toBeGreaterThanOrEqual(delayMs - 150);
    });

    it('should not delay the first task', async () => {
      const delayMs = 1000;
      const queue = new RateLimitedQueue<number>(delayMs);

      const startTime = Date.now();
      await queue.enqueue(async () => 1);
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(100);
    });

    it('should apply rate limiting even with slow tasks', async () => {
      const delayMs = 300;
      const taskDuration = 100;
      const queue = new RateLimitedQueue<number>(delayMs);
      const executionTimes: number[] = [];

      const slowTask = async (value: number) => {
        executionTimes.push(Date.now());
        await sleep(taskDuration);
        return value;
      };

      const promises = [
        queue.enqueue(() => slowTask(1)),
        queue.enqueue(() => slowTask(2)),
      ];

      await Promise.all(promises);

      const delay = executionTimes[1] - executionTimes[0];
      expect(delay).toBeGreaterThanOrEqual(delayMs - 150);
    });

    it('should respect rate limit with fast consecutive enqueues', async () => {
      const delayMs = 400;
      const queue = new RateLimitedQueue<number>(delayMs);
      const executionTimes: number[] = [];

      // Enqueue all tasks synchronously (no await)
      const p1 = queue.enqueue(async () => { executionTimes.push(Date.now()); return 1; });
      const p2 = queue.enqueue(async () => { executionTimes.push(Date.now()); return 2; });
      const p3 = queue.enqueue(async () => { executionTimes.push(Date.now()); return 3; });

      await Promise.all([p1, p2, p3]);

      expect(executionTimes).toHaveLength(3);

      const delay1 = executionTimes[1] - executionTimes[0];
      const delay2 = executionTimes[2] - executionTimes[1];

      expect(delay1).toBeGreaterThanOrEqual(delayMs - 150);
      expect(delay2).toBeGreaterThanOrEqual(delayMs - 150);
    });

    it('should maintain rate limit across multiple batches', async () => {
      const delayMs = 200;
      const queue = new RateLimitedQueue<number>(delayMs);
      const executionTimes: number[] = [];

      // First batch
      await Promise.all([
        queue.enqueue(async () => { executionTimes.push(Date.now()); return 1; }),
        queue.enqueue(async () => { executionTimes.push(Date.now()); return 2; }),
      ]);

      // Second batch - should still respect rate limit from first batch
      await Promise.all([
        queue.enqueue(async () => { executionTimes.push(Date.now()); return 3; }),
        queue.enqueue(async () => { executionTimes.push(Date.now()); return 4; }),
      ]);

      // Verify all delays between consecutive tasks
      for (let i = 1; i < executionTimes.length; i += 1) {
        const delay = executionTimes[i] - executionTimes[i - 1];
        expect(delay).toBeGreaterThanOrEqual(delayMs - 150);
      }
    });

    it('should calculate total execution time with rate limiting', async () => {
      const delayMs = 200;
      const taskCount = 4;
      const queue = new RateLimitedQueue<number>(delayMs);

      const startTime = Date.now();

      await Promise.all(
        Array.from({ length: taskCount }, (_, i) => queue.enqueue(async () => i)),
      );

      const totalTime = Date.now() - startTime;

      // Expected time: first task immediate, then 3 tasks with 200ms delay each
      // Minimum time = 3 * 200 = 600ms
      const expectedMinTime = (taskCount - 1) * delayMs;

      expect(totalTime).toBeGreaterThanOrEqual(expectedMinTime - 300);
      expect(totalTime).toBeLessThan(expectedMinTime + 500);
    });

    it('should measure rate limit accuracy', async () => {
      const delayMs = 300;
      const queue = new RateLimitedQueue<number>(delayMs);
      const actualDelays: number[] = [];

      let lastExecutionTime = Date.now();

      await queue.enqueue(async () => {
        lastExecutionTime = Date.now();
        return 1;
      });

      await queue.enqueue(async () => {
        const now = Date.now();
        actualDelays.push(now - lastExecutionTime);
        lastExecutionTime = now;
        return 2;
      });

      await queue.enqueue(async () => {
        const now = Date.now();
        actualDelays.push(now - lastExecutionTime);
        return 3;
      });

      actualDelays.forEach((actualDelay) => {
        expect(actualDelay).toBeGreaterThanOrEqual(delayMs - 150);
        expect(actualDelay).toBeLessThan(delayMs + 500);
      });
    });
  });

  describe('Rate Limiting Edge Cases', () => {
    it('should handle zero delay configuration', async () => {
      const queue = new RateLimitedQueue<number>(0);

      const startTime = Date.now();
      await Promise.all([
        queue.enqueue(async () => 1),
        queue.enqueue(async () => 2),
        queue.enqueue(async () => 3),
      ]);
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(200);
    });

    it('should handle very large delay configuration', async () => {
      const delayMs = 1500;
      const queue = new RateLimitedQueue<number>(delayMs);
      const executionTimes: number[] = [];

      // Sequential enqueue: ensures task2 is enqueued after task1 fully completes,
      // bypassing setImmediate latency that WSL2 can inflate to 500-800ms.
      await queue.enqueue(async () => { executionTimes.push(Date.now()); return 1; });
      await queue.enqueue(async () => { executionTimes.push(Date.now()); return 2; });

      const delay = executionTimes[1] - executionTimes[0];
      expect(delay).toBeGreaterThanOrEqual(delayMs - 300);
    }, 5000);

    it('should handle rate limiting when tasks complete instantly', async () => {
      const delayMs = 250;
      const queue = new RateLimitedQueue<number>(delayMs);
      const executionTimes: number[] = [];

      await Promise.all([
        queue.enqueue(async () => { executionTimes.push(Date.now()); return 1; }),
        queue.enqueue(async () => { executionTimes.push(Date.now()); return 2; }),
        queue.enqueue(async () => { executionTimes.push(Date.now()); return 3; }),
      ]);

      for (let i = 1; i < executionTimes.length; i += 1) {
        const delay = executionTimes[i] - executionTimes[i - 1];
        expect(delay).toBeGreaterThanOrEqual(delayMs - 150);
      }
    });

    it('should handle errors without affecting rate limiting', async () => {
      const delayMs = 300;
      const queue = new RateLimitedQueue<number>(delayMs);
      const executionTimes: number[] = [];

      const p1 = queue.enqueue(async () => {
        executionTimes.push(Date.now());
        return 1;
      });
      const p2 = queue.enqueue(async () => {
        executionTimes.push(Date.now());
        throw new Error('Task failed');
      });
      const p3 = queue.enqueue(async () => {
        executionTimes.push(Date.now());
        return 3;
      });

      await expect(p1).resolves.toBe(1);
      await expect(p2).rejects.toThrow('Task failed');
      await expect(p3).resolves.toBe(3);

      // Verify rate limiting still applied despite error
      const delay1 = executionTimes[1] - executionTimes[0];
      const delay2 = executionTimes[2] - executionTimes[1];

      expect(delay1).toBeGreaterThanOrEqual(delayMs - 150);
      expect(delay2).toBeGreaterThanOrEqual(delayMs - 150);
    });

    it('should handle small delay values accurately', async () => {
      const delayMs = 50;
      const queue = new RateLimitedQueue<number>(delayMs);
      const executionTimes: number[] = [];

      await Promise.all([
        queue.enqueue(async () => { executionTimes.push(Date.now()); return 1; }),
        queue.enqueue(async () => { executionTimes.push(Date.now()); return 2; }),
        queue.enqueue(async () => { executionTimes.push(Date.now()); return 3; }),
      ]);

      for (let i = 1; i < executionTimes.length; i += 1) {
        const delay = executionTimes[i] - executionTimes[i - 1];
        expect(delay).toBeGreaterThanOrEqual(delayMs - 35);
      }
    });
  });

  describe('Rate Limiting with Queue States', () => {
    it('should apply rate limit when queue is actively processing', async () => {
      const delayMs = 400;
      const queue = new RateLimitedQueue<number>(delayMs);
      const executionTimes: number[] = [];

      const p1 = queue.enqueue(async () => {
        executionTimes.push(Date.now());
        await sleep(100);
        return 1;
      });

      // Wait a bit to ensure first task is processing
      await sleep(50);

      const p2 = queue.enqueue(async () => {
        executionTimes.push(Date.now());
        return 2;
      });

      await Promise.all([p1, p2]);

      const delay = executionTimes[1] - executionTimes[0];
      expect(delay).toBeGreaterThanOrEqual(delayMs - 150);
    });

    it('should not apply rate limit after sufficient idle time', async () => {
      const delayMs = 300;
      const queue = new RateLimitedQueue<number>(delayMs);

      await queue.enqueue(async () => 1);

      // Wait longer than the delay to ensure rate limit window has passed
      await sleep(delayMs + 100);

      const startTime = Date.now();
      await queue.enqueue(async () => 2);
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(100);
    });

    it('should maintain correct queue state during rate limiting', async () => {
      const delayMs = 200;
      const queue = new RateLimitedQueue<number>(delayMs);

      const p1 = queue.enqueue(async () => 1);
      const p2 = queue.enqueue(async () => 2);
      const p3 = queue.enqueue(async () => 3);

      // Give time for first task to start
      await sleep(50);

      expect(queue.isProcessingTask()).toBe(true);
      expect(queue.getQueueLength()).toBeGreaterThanOrEqual(1);

      await Promise.all([p1, p2, p3]);

      expect(queue.isProcessingTask()).toBe(false);
      expect(queue.getQueueLength()).toBe(0);
    });
  });
});
