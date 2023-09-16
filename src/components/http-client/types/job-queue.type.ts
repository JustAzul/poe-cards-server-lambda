export type JobQueue<T = unknown> = {
  job: () => Promise<T>;
  id: symbol;
};
