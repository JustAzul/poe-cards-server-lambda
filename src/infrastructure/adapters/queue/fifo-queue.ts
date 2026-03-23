import { EventEmitter } from 'events';

export interface QueuedTask<T> {
  execute: () => Promise<T>;
  resolve: (value: T) => void;
  reject: (error: Error) => void;
}

export class FIFOQueue<T> extends EventEmitter {
  protected tasks: Array<QueuedTask<T>> = [];

  protected isProcessing: boolean = false;

  constructor() {
    super();
    this.on('queue:process', () => this.processNext());
  }

  async enqueue(execute: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.tasks.push({ execute, resolve, reject });
      this.emit('queue:enqueued', { queueLength: this.tasks.length });
      this.emit('queue:process');
    });
  }

  // Hook for subclasses to run logic before each task executes (e.g. rate limiting)
  // eslint-disable-next-line class-methods-use-this
  protected async beforeExecute(): Promise<void> { /* no-op by default */ }

  protected async processNext(): Promise<void> {
    if (this.isProcessing || this.tasks.length === 0) return;
    this.isProcessing = true;
    const task = this.tasks.shift();
    if (!task) { this.isProcessing = false; return; }
    await this.beforeExecute();
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
      if (this.tasks.length > 0) {
        setImmediate(() => this.emit('queue:process'));
      }
    }
  }

  getQueueLength(): number { return this.tasks.length; }

  isProcessingTask(): boolean { return this.isProcessing; }
}
