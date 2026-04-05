import { sleep } from '@shared/utils';
import { FIFOQueue } from '@infrastructure/adapters/queue/fifo-queue';

describe('Queue - Black Box Tests', () => {
  describe('Task Execution', () => {
    it('should execute a single task successfully', async () => {
      const queue = new FIFOQueue<string>();
      const result = await queue.enqueue(async () => 'test-result');

      expect(result).toBe('test-result');
    });

    it('should execute tasks in FIFO order', async () => {
      const queue = new FIFOQueue<number>();
      const results: number[] = [];

      const promises = [
        queue.enqueue(async () => { results.push(1); return 1; }),
        queue.enqueue(async () => { results.push(2); return 2; }),
        queue.enqueue(async () => { results.push(3); return 3; }),
      ];

      await Promise.all(promises);

      expect(results).toEqual([1, 2, 3]);
    });

    it('should handle multiple tasks and return correct results', async () => {
      const queue = new FIFOQueue<string>();

      const [r1, r2, r3] = await Promise.all([
        queue.enqueue(async () => 'first'),
        queue.enqueue(async () => 'second'),
        queue.enqueue(async () => 'third'),
      ]);

      expect(r1).toBe('first');
      expect(r2).toBe('second');
      expect(r3).toBe('third');
    });

    it('should process tasks sequentially, not in parallel', async () => {
      const queue = new FIFOQueue<number>();
      let activeTaskCount = 0;
      let maxConcurrent = 0;

      const task = async (value: number) => {
        activeTaskCount += 1;
        maxConcurrent = Math.max(maxConcurrent, activeTaskCount);
        await sleep(50);
        activeTaskCount -= 1;
        return value;
      };

      await Promise.all([
        queue.enqueue(() => task(1)),
        queue.enqueue(() => task(2)),
        queue.enqueue(() => task(3)),
      ]);

      expect(maxConcurrent).toBe(1);
    });
  });

  describe('Error Handling', () => {
    it('should reject when task throws an error', async () => {
      const queue = new FIFOQueue<string>();
      const error = new Error('Task failed');

      await expect(
        queue.enqueue(async () => {
          throw error;
        }),
      ).rejects.toThrow('Task failed');
    });

    it('should continue processing after error', async () => {
      const queue = new FIFOQueue<number>();

      const p1 = queue.enqueue(async () => {
        throw new Error('First task failed');
      });
      const p2 = queue.enqueue(async () => 2);
      const p3 = queue.enqueue(async () => 3);

      await expect(p1).rejects.toThrow('First task failed');
      await expect(p2).resolves.toBe(2);
      await expect(p3).resolves.toBe(3);
    });

    it('should handle non-Error throws', async () => {
      const queue = new FIFOQueue<string>();

      await expect(
        queue.enqueue(async () => {
          // eslint-disable-next-line no-throw-literal
          throw 'string error';
        }),
      ).rejects.toThrow('string error');
    });

    it('should reject all affected promises when task fails', async () => {
      const queue = new FIFOQueue<number>();

      const p1 = queue.enqueue(async () => 1);
      const p2 = queue.enqueue(async () => {
        throw new Error('Middle task failed');
      });
      const p3 = queue.enqueue(async () => 3);

      const results = await Promise.allSettled([p1, p2, p3]);

      expect(results[0].status).toBe('fulfilled');
      expect(results[1].status).toBe('rejected');
      expect(results[2].status).toBe('fulfilled');
    });
  });

  describe('Queue State', () => {
    it('should start with empty queue', async () => {
      const queue = new FIFOQueue<string>();

      expect(queue.getQueueLength()).toBe(0);
      expect(queue.isProcessingTask()).toBe(false);
    });

    it('should track queue length correctly', async () => {
      const queue = new FIFOQueue<string>();

      expect(queue.getQueueLength()).toBe(0);

      const p1 = queue.enqueue(async () => {
        await sleep(100);
        return 'test1';
      });
      const p2 = queue.enqueue(async () => 'test2');
      const p3 = queue.enqueue(async () => 'test3');

      // Give time for first task to start processing
      await sleep(50);

      // At this point, one task is processing and two are queued
      expect(queue.getQueueLength()).toBeLessThanOrEqual(2);

      await Promise.all([p1, p2, p3]);

      expect(queue.getQueueLength()).toBe(0);
    });

    it('should track processing state correctly', async () => {
      const queue = new FIFOQueue<string>();

      expect(queue.isProcessingTask()).toBe(false);

      const taskPromise = queue.enqueue(async () => {
        await sleep(200);
        return 'test';
      });

      // Give time for task to start
      await sleep(50);

      expect(queue.isProcessingTask()).toBe(true);

      await taskPromise;

      expect(queue.isProcessingTask()).toBe(false);
    });

    it('should return to idle state after completing all tasks', async () => {
      const queue = new FIFOQueue<number>();

      await Promise.all([
        queue.enqueue(async () => 1),
        queue.enqueue(async () => 2),
        queue.enqueue(async () => 3),
      ]);

      expect(queue.getQueueLength()).toBe(0);
      expect(queue.isProcessingTask()).toBe(false);
    });
  });
});
