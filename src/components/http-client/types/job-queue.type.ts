export type JobQueue<T = unknown> = {
  id: symbol;
  job: () => Promise<T>;
};
