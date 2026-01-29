import axios from 'axios';
import { sleep } from '@shared/utils';
import { HttpConfig } from '@infrastructure/types/http-config.types';
import { RateLimitedQueue } from '@infrastructure/queue/rate-limited-queue';

const DEFAULT_USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36';

/**
 * HTTP Client with rate limiting via queue and retry logic
 * Uses RateLimitedQueue for sequential request processing with rate limiting
 */
export class HttpClient {
  private queue: RateLimitedQueue<unknown>;

  private readonly headers: Record<string, string>;

  constructor(
    private readonly config: HttpConfig = {
      throttleDelayMs: 2000,
      maxRetries: 3,
      retryDelayMs: 2000,
      exponentialBackoff: true,
    },
    additionalHeaders: Record<string, string> = {},
  ) {
    this.queue = new RateLimitedQueue(this.config.throttleDelayMs);
    this.headers = {
      'User-Agent': DEFAULT_USER_AGENT,
      ...additionalHeaders,
    };
  }

  /**
   * Make an HTTP GET request with retry logic
   * Rate limiting is handled by the queue
   */
  async get<T>(url: string, searchParams?: Record<string, unknown>): Promise<T> {
    return this.queue.enqueue(async () => {
      const result = await this.retryableRequest<T>(
        () => axios.get<T>(url, {
          params: searchParams,
          headers: this.headers,
        }),
        `GET ${url}`,
      );
      return result.data;
    }) as Promise<T>;
  }

  /**
   * Execute HTTP request with retry logic
   */
  private async retryableRequest<T>(
    requestFn: () => Promise<{ data: T }>,
    operationName: string,
    attempt: number = 0,
  ): Promise<{ data: T }> {
    try {
      return await requestFn();
    } catch (error) {
      const { maxRetries, retryDelayMs, exponentialBackoff } = this.config;

      if (attempt >= maxRetries) {
        throw new Error(`${operationName} failed: ${(error as Error).message}`);
      }

      const delayMs = exponentialBackoff
        ? retryDelayMs * 2 ** attempt
        : retryDelayMs;

      await sleep(delayMs);

      return this.retryableRequest(requestFn, operationName, attempt + 1);
    }
  }
}

export default new HttpClient();
