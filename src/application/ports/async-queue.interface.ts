export interface IAsyncQueue<T> {
  insertAndProcess<R>(job: (input?: T) => Promise<R>): Promise<R>;
}
