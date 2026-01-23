import { EventEmitter } from 'events';

export interface QueuedTask<T> {
  execute: () => Promise<T>;
  resolve: (value: T) => void;
  reject: (error: Error) => void;
}

/**
 * Generic queue for processing tasks sequentially via pub/sub events
 * Tasks are executed one at a time in FIFO order
 */
export class FIFOQueue<T> extends EventEmitter {
  protected tasks: Array<QueuedTask<T>> = [];

  protected isProcessing: boolean = false;

  constructor() {
    super();
    this.on('queue:process', () => this.processNext());
  }

  /**
   * Add a task to the queue and trigger processing
   */
  async enqueue(execute: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.tasks.push({ execute, resolve, reject });
      this.emit('queue:enqueued', { queueLength: this.tasks.length });
      this.emit('queue:process');
    });
  }

  /**
   * Process the next task in the queue
   * Called via queue:process event
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
   * Get current queue length
   */
  getQueueLength(): number {
    return this.tasks.length;
  }

  /**
   * Check if queue is currently processing
   */
  isProcessingTask(): boolean {
    return this.isProcessing;
  }
}
