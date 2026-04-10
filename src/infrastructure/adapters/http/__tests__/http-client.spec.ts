import axios, { AxiosError } from 'axios';
import { sleep } from '@shared/utils';
import { HttpClient } from '@infrastructure/adapters/http/http-client';

jest.mock('axios');
jest.mock('@shared/utils', () => ({
  sleep: jest.fn().mockResolvedValue(undefined),
}));

const mockedAxiosGet = axios.get as jest.MockedFunction<typeof axios.get>;
const mockedSleep = sleep as jest.MockedFunction<typeof sleep>;

function createAxiosError(status: number, headers: Record<string, string> = {}): AxiosError {
  const error = new AxiosError(`Request failed with status ${status}`);
  /* eslint-disable @typescript-eslint/no-explicit-any */
  error.response = {
    status, headers, data: null, statusText: '', config: {} as any,
  } as any;
  /* eslint-enable @typescript-eslint/no-explicit-any */
  return error;
}

describe('HttpClient', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Successful requests', () => {
    it('returns response data on successful GET', async () => {
      const payload = { id: 1, name: 'Fireball' };
      mockedAxiosGet.mockResolvedValueOnce({ data: payload });

      const client = new HttpClient({ throttleDelayMs: 0, maxRetries: 2 });
      const result = await client.get<typeof payload>('https://example.com/cards');

      expect(result).toEqual(payload);
    });

    it('passes timeout and headers to axios', async () => {
      mockedAxiosGet.mockResolvedValueOnce({ data: {} });

      const client = new HttpClient(
        { throttleDelayMs: 0, maxRetries: 2, requestTimeoutMs: 5000 },
        { 'X-Custom': 'value' },
      );
      await client.get('https://example.com/cards');

      expect(mockedAxiosGet).toHaveBeenCalledWith(
        'https://example.com/cards',
        expect.objectContaining({
          timeout: 5000,
          headers: expect.objectContaining({
            'User-Agent': expect.any(String),
            'X-Custom': 'value',
          }),
        }),
      );
    });

    it('passes search params to axios', async () => {
      mockedAxiosGet.mockResolvedValueOnce({ data: [] });

      const client = new HttpClient({ throttleDelayMs: 0, maxRetries: 2 });
      await client.get('https://example.com/cards', { league: 'Standard', limit: 10 });

      expect(mockedAxiosGet).toHaveBeenCalledWith(
        'https://example.com/cards',
        expect.objectContaining({
          params: { league: 'Standard', limit: 10 },
        }),
      );
    });
  });

  describe('4xx error handling', () => {
    it('throws immediately on 4xx non-429 without retrying', async () => {
      mockedAxiosGet.mockRejectedValueOnce(createAxiosError(404));

      const client = new HttpClient({ throttleDelayMs: 0, maxRetries: 2 });
      await expect(client.get('https://example.com/cards')).rejects.toThrow('failed with status 404');

      expect(mockedAxiosGet).toHaveBeenCalledTimes(1);
    });

    it('includes the original AxiosError as cause on 4xx', async () => {
      const axiosError = createAxiosError(400);
      mockedAxiosGet.mockRejectedValueOnce(axiosError);

      const client = new HttpClient({ throttleDelayMs: 0, maxRetries: 2 });

      let thrown: Error | undefined;
      try {
        await client.get('https://example.com/cards');
      } catch (err) {
        thrown = err as Error;
      }

      expect(thrown).toBeDefined();
      expect(thrown!.cause).toBe(axiosError);
    });
  });

  describe('429 rate-limit handling', () => {
    it('retries after the delay specified in Retry-After header', async () => {
      const rateLimitError = createAxiosError(429, { 'retry-after': '30' });
      mockedAxiosGet
        .mockRejectedValueOnce(rateLimitError)
        .mockResolvedValueOnce({ data: { ok: true } });

      const client = new HttpClient({ throttleDelayMs: 0, maxRetries: 2 });
      const result = await client.get<{ ok: boolean }>('https://example.com/cards');

      expect(result).toEqual({ ok: true });
      expect(mockedAxiosGet).toHaveBeenCalledTimes(2);
      expect(mockedSleep).toHaveBeenCalledWith(30 * 1000);
    });

    it('uses default 60s delay when Retry-After header is absent', async () => {
      const rateLimitError = createAxiosError(429);
      mockedAxiosGet
        .mockRejectedValueOnce(rateLimitError)
        .mockResolvedValueOnce({ data: {} });

      const client = new HttpClient({ throttleDelayMs: 0, maxRetries: 2 });
      await client.get('https://example.com/cards');

      expect(mockedSleep).toHaveBeenCalledWith(60 * 1000);
    });

    it('uses default 60s delay when Retry-After header is not a valid number', async () => {
      const rateLimitError = createAxiosError(429, { 'retry-after': 'invalid' });
      mockedAxiosGet
        .mockRejectedValueOnce(rateLimitError)
        .mockResolvedValueOnce({ data: {} });

      const client = new HttpClient({ throttleDelayMs: 0, maxRetries: 2 });
      await client.get('https://example.com/cards');

      expect(mockedSleep).toHaveBeenCalledWith(60 * 1000);
    });
  });

  describe('5xx retry with exponential backoff', () => {
    it('retries 5xx errors with exponential backoff delays', async () => {
      const serverError = createAxiosError(503);
      mockedAxiosGet
        .mockRejectedValueOnce(serverError)
        .mockRejectedValueOnce(serverError)
        .mockResolvedValueOnce({ data: { recovered: true } });

      const client = new HttpClient({
        throttleDelayMs: 0,
        maxRetries: 2,
        retryDelayMs: 100,
        exponentialBackoff: true,
      });
      const result = await client.get<{ recovered: boolean }>('https://example.com/cards');

      expect(result).toEqual({ recovered: true });
      expect(mockedAxiosGet).toHaveBeenCalledTimes(3);
      // attempt 0: 100 * 2^0 = 100ms, attempt 1: 100 * 2^1 = 200ms
      expect(mockedSleep).toHaveBeenNthCalledWith(1, 100);
      expect(mockedSleep).toHaveBeenNthCalledWith(2, 200);
    });

    it('retries non-Axios errors (e.g. TypeError) with backoff', async () => {
      const networkError = new TypeError('fetch failed');
      mockedAxiosGet
        .mockRejectedValueOnce(networkError)
        .mockResolvedValueOnce({ data: { ok: true } });

      const client = new HttpClient({
        throttleDelayMs: 0,
        maxRetries: 2,
        retryDelayMs: 50,
        exponentialBackoff: true,
      });
      const result = await client.get<{ ok: boolean }>('https://example.com/cards');

      expect(result).toEqual({ ok: true });
      expect(mockedAxiosGet).toHaveBeenCalledTimes(2);
      expect(mockedSleep).toHaveBeenCalledWith(50);
    });
  });

  describe('Retries exhausted', () => {
    it('throws a descriptive error with cause when all retries are exhausted', async () => {
      const serverError = createAxiosError(500);
      mockedAxiosGet.mockRejectedValue(serverError);

      const client = new HttpClient({ throttleDelayMs: 0, maxRetries: 2 });

      let thrown: Error | undefined;
      try {
        await client.get('https://example.com/cards');
      } catch (err) {
        thrown = err as Error;
      }

      expect(thrown).toBeDefined();
      expect(thrown!.message).toMatch(/failed after 2 retries/);
      expect(thrown!.cause).toBe(serverError);
      // 3 total calls: initial + 2 retries
      expect(mockedAxiosGet).toHaveBeenCalledTimes(3);
    });
  });

  describe('Custom headers', () => {
    it('merges additional headers with the default User-Agent', async () => {
      mockedAxiosGet.mockResolvedValueOnce({ data: {} });

      const client = new HttpClient(
        { throttleDelayMs: 0, maxRetries: 2 },
        { Authorization: 'Bearer token123', 'X-Api-Key': 'abc' },
      );
      await client.get('https://example.com/cards');

      expect(mockedAxiosGet).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: {
            'User-Agent': expect.stringContaining('Mozilla'),
            Authorization: 'Bearer token123',
            'X-Api-Key': 'abc',
          },
        }),
      );
    });
  });
});
