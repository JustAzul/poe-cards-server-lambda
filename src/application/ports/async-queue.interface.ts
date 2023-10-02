export interface IAsyncQueue<T> {
  insertAndProcess<R>(job: (input?: T) => Promise<unknown>): Promise<R>;
}
