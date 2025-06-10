import { IAsyncQueue } from '../../application/ports/async-queue.interface';

export default class SimpleAsyncQueue<T> implements IAsyncQueue<T> {
  private lastPromise: Promise<unknown> = Promise.resolve();

  async insertAndProcess<R>(job: (input?: T) => Promise<R>): Promise<R> {
    const result = this.lastPromise.then(() => job());
    this.lastPromise = result.catch(() => {});
    return result;
  }
}
