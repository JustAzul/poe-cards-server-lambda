import { sleep } from '@shared/utils';
import { Queue } from './queue';

/**
 * Rate-limited queue for processing tasks sequentially with rate limiting
 * Enforces minimum delay between task executions
 */
export class RateLimitedQueue<T> extends Queue<T> {
  private lastExecutionTime: number | null = null;

  constructor(private readonly delayMs: number = 2000) {
    super();
  }

  /**
   * Process the next task with rate limiting
   * Overrides parent to add rate limiting enforcement
   */
  protected async processNext(): Promise<void> {
    if (this.isProcessing || this.tasks.length === 0) {
      return;
    }

    this.isProcessing = true;
    const task = this.tasks.shift();

    if (!task) {
      this.isProcessing = false;
      return;
    }

    await this.enforceRateLimit();

    const { execute, resolve, reject } = task;

    this.emit('task:start', { queueLength: this.tasks.length });
    try {
      const result = await execute();
      this.emit('task:success', { queueLength: this.tasks.length });
      resolve(result);
    } catch (error) {
      this.emit('task:error', { error: error instanceof Error ? error : new Error(String(error)), queueLength: this.tasks.length });
      reject(error instanceof Error ? error : new Error(String(error)));
    } finally {
      this.isProcessing = false;
      // Emit queue:process to handle next task if any
      if (this.tasks.length > 0) {
        setImmediate(() => this.emit('queue:process'));
      }
    }
  }

  /**
   * Enforce rate limiting by waiting if necessary
   * Emits: rateLimit:applied
   */
  private async enforceRateLimit(): Promise<void> {
    if (this.lastExecutionTime !== null) {
      const timeSinceLastExecution = Date.now() - this.lastExecutionTime;
      const remainingDelay = this.delayMs - timeSinceLastExecution;

      if (remainingDelay > 0) {
        this.emit('rateLimit:applied', { delayMs: remainingDelay });
        await sleep(remainingDelay);
      }
    }

    this.lastExecutionTime = Date.now();
  }
}

export const rateLimitedQueue = new RateLimitedQueue();
