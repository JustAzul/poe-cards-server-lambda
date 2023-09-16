import axios from 'axios';

import HttpClient from '..';
import HttpClientUtils from '../utils';

jest.mock('axios');

describe('HttpClient', () => {
  let httpClient: HttpClient;

  beforeEach(() => {
    httpClient = new HttpClient();
  });

  // Constructor test
  it('initializes delayBetweenJobs correctly', () => {
    const delay = 1000;
    const customHttpClient = new HttpClient(delay);
    // @ts-expect-error - testing private property.
    expect(customHttpClient.delayBetweenJobs).toBe(delay);
  });

  it('creates a job with correct configuration and adds it to the queue', () => {
    const mockUrl = 'http://example.com';
    const mockConfig = { some: 'config' } as never;

    // @ts-expect-error - testing private property.
    const job = httpClient.createJob({
      config: mockConfig,
      url: mockUrl,
    });

    // Verify job's properties.
    expect(typeof job.job).toBe('function');
    expect(typeof job.id).toBe('symbol');

    // @ts-expect-error - testing private property.
    httpClient.insertIntoQueue(job);

    // Check if the job is added to the queue.

    // @ts-expect-error - testing private property.
    const queuedJob = httpClient.queue.find((j) => j.id === job.id);

    expect(queuedJob).toBeDefined();
    expect(queuedJob?.job).toBe(job.job);
    expect(queuedJob?.id).toBe(job.id);
  });

  // get method test
  it('get method creates and processes a job', async () => {
    const mockResponse = { data: 'mockData' };

    // Step 1: Set up the spy.
    const getSpy = jest.spyOn(axios, 'get');

    // Step 2: Use the mock implementation.
    getSpy.mockResolvedValueOnce(mockResponse);

    const mockUrl = 'http://example.com';
    const response = await httpClient.get({ url: mockUrl });

    expect(response).toEqual(mockResponse);

    // Step 3: Assert on the spy.
    expect(getSpy).toHaveBeenCalledWith(
      mockUrl,
      HttpClientUtils.mergeConfig(expect.any(String) as string, undefined),
    );

    // Clean up by restoring the original method.
    getSpy.mockRestore();
  });

  // Error handling in get method
  it('get method handles errors correctly', async () => {
    const mockError = new Error('Mock Error');
    (axios.get as jest.Mock).mockRejectedValueOnce(mockError);

    const mockUrl = 'http://example.com';

    await expect(httpClient.get({ url: mockUrl })).rejects.toThrow(mockError);
  });
});
