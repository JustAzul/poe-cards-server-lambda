import { IAsyncQueue } from '../../application/ports/async-queue.interface';
import sleep from '../../shared/helpers/sleep.helper';

export default class SimpleAsyncQueue<T> implements IAsyncQueue<T> {
  private readonly delayInMs: number;

  private lastPromise: Promise<unknown> = Promise.resolve();

  constructor(delayInMs = 0) {
    this.delayInMs = delayInMs;
  }

  async insertAndProcess<R>(job: (input?: T) => Promise<R>): Promise<R> {
    const result = this.lastPromise
      .then(() => job())
      .then(async (jobResult) => {
        if (this.delayInMs > 0) {
          await sleep(this.delayInMs);
        }

        return jobResult;
      });

    this.lastPromise = result.catch(() => {});

    return result;
  }
}
