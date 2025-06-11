import SimpleAsyncQueue from '../simple-async-queue';

describe('SimpleAsyncQueue', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const createDelayedJob = <T>(
    value: T,
    delay: number,
    markers: number[],
    start: number,
  ) =>
    new Promise<T>((resolve) => {
      markers.push(Date.now() - start);
      setTimeout(() => resolve(value), delay);
    });

  it('should resolve queued promises in order and respect delays', async () => {
    const queue = new SimpleAsyncQueue<void>();
    const startTime = Date.now();
    const startMarkers: number[] = [];

    const first = queue.insertAndProcess(() =>
      createDelayedJob('first', 50, startMarkers, startTime),
    );
    const second = queue.insertAndProcess(() =>
      createDelayedJob('second', 30, startMarkers, startTime),
    );
    const third = queue.insertAndProcess(() =>
      createDelayedJob('third', 20, startMarkers, startTime),
    );

    await jest.runAllTimersAsync();
    const results = await Promise.all([first, second, third]);

    expect(results).toEqual(['first', 'second', 'third']);
    expect(startMarkers).toEqual([0, 50, 80]);
  });
});
