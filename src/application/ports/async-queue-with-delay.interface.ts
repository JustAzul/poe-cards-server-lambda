export interface IAsyncQueueWithDelay<T> {
  insertAndProcess<R>(data: T): Promise<R>;
}
