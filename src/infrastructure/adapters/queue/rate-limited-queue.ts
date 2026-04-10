import { sleep } from '@shared/utils';
import { FIFOQueue } from '@infrastructure/adapters/queue/fifo-queue';

export class RateLimitedQueue<T> extends FIFOQueue<T> {
  private lastExecutionTime: number | null = null;

  constructor(private readonly delayMs: number = 2000) {
    super();
  }

  protected async beforeExecute(): Promise<void> {
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
