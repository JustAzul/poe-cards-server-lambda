export type JobQueue<T = unknown> = {
  id: symbol;
  promise: () => Promise<T>;
};
