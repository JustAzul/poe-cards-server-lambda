import axios, { AxiosError } from 'axios';
import { sleep } from '@shared/utils';
import { HttpConfig } from '@infrastructure/types/http-config.types';
import { RateLimitedQueue } from '@infrastructure/adapters/queue/rate-limited-queue';

const DEFAULT_USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36';
const DEFAULT_RETRY_SECONDS = 60;

export class HttpClient {
  private queue: RateLimitedQueue<unknown>;

  private readonly config: Required<HttpConfig>;

  private readonly headers: Record<string, string>;

  constructor(config: HttpConfig = {}, additionalHeaders: Record<string, string> = {}) {
    const defaults: Required<HttpConfig> = {
      throttleDelayMs: 2000,
      maxRetries: 3,
      retryDelayMs: 2000,
      exponentialBackoff: true,
      requestTimeoutMs: 30000,
    };
    this.config = { ...defaults, ...config };
    this.queue = new RateLimitedQueue(this.config.throttleDelayMs);
    this.headers = { 'User-Agent': DEFAULT_USER_AGENT, ...additionalHeaders };
  }

  async get<T>(url: string, searchParams?: Record<string, unknown>): Promise<T> {
    return this.queue.enqueue(async () => {
      const result = await this.retryableRequest<T>(
        () => axios.get<T>(url, {
          params: searchParams,
          headers: this.headers,
          timeout: this.config.requestTimeoutMs,
        }),
        `GET ${url}`,
      );
      return result.data;
    }) as Promise<T>;
  }

  private async retryableRequest<T>(
    requestFn: () => Promise<{ data: T }>,
    operationName: string,
  ): Promise<{ data: T }> {
    const { maxRetries, retryDelayMs, exponentialBackoff } = this.config;
    let lastError: unknown;

    for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
      try {
        // eslint-disable-next-line no-await-in-loop
        return await requestFn();
      } catch (error) {
        lastError = error;
        const isLastAttempt = attempt >= maxRetries;

        if (error instanceof AxiosError && error.response) {
          const { status } = error.response;
          if (status >= 400 && status < 500 && status !== 429) {
            throw new Error(`${operationName} failed with status ${status}: ${error.message}`, { cause: error });
          }
          if (status === 429) {
            if (!isLastAttempt) {
              const parsed = parseInt(error.response.headers['retry-after'] ?? '', 10);
              const retryAfterSeconds = Number.isNaN(parsed) || parsed <= 0
                ? DEFAULT_RETRY_SECONDS
                : parsed;
              // eslint-disable-next-line no-await-in-loop
              await sleep(retryAfterSeconds * 1000);
            }
          } else if (!isLastAttempt) {
            const delayMs = exponentialBackoff ? retryDelayMs * 2 ** attempt : retryDelayMs;
            // eslint-disable-next-line no-await-in-loop
            await sleep(delayMs);
          }
        } else if (!isLastAttempt) {
          const delayMs = exponentialBackoff ? retryDelayMs * 2 ** attempt : retryDelayMs;
          // eslint-disable-next-line no-await-in-loop
          await sleep(delayMs);
        }
      }
    }

    throw new Error(`${operationName} failed after ${maxRetries} retries`, { cause: lastError });
  }
}
