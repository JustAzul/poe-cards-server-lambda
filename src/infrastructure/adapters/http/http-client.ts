import axios, { AxiosError } from 'axios';
import { sleep } from '@shared/utils';
import { HttpConfig } from '@infrastructure/types/http-config.types';
import { RateLimitedQueue } from '@infrastructure/adapters/queue/rate-limited-queue';

const DEFAULT_USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36';

/**
 * HTTP Client with rate limiting via queue and retry logic
 * Uses RateLimitedQueue for sequential request processing with rate limiting
 */
export class HttpClient {
  // Queue is typed as <unknown> because HttpClient serves multiple response types.
  // Each get<T>() call casts the result; type safety is enforced by the axios generic.
  private queue: RateLimitedQueue<unknown>;

  private readonly config: Required<HttpConfig>;

  private readonly headers: Record<string, string>;

  constructor(
    config: HttpConfig = {},
    additionalHeaders: Record<string, string> = {},
  ) {
    const defaults: Required<HttpConfig> = {
      throttleDelayMs: 2000,
      maxRetries: 3,
      retryDelayMs: 2000,
      exponentialBackoff: true,
      requestTimeoutMs: 30000,
    };
    this.config = { ...defaults, ...config };
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
          timeout: this.config.requestTimeoutMs,
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

      // Don't retry non-retryable 4xx errors (except 429)
      if (error instanceof AxiosError && error.response) {
        const { status } = error.response;
        if (status >= 400 && status < 500 && status !== 429) {
          throw new Error(`${operationName} failed with status ${status}: ${error.message}`);
        }
      }

      if (attempt >= maxRetries) {
        throw new Error(`${operationName} failed: ${error instanceof Error ? error.message : String(error)}`);
      }

      // Rate-limited: respect Retry-After header or default to 60s
      if (error instanceof AxiosError && error.response?.status === 429) {
        const retryAfter = parseInt(error.response.headers['retry-after'] ?? '60', 10);
        await sleep(retryAfter * 1000);
        return this.retryableRequest(requestFn, operationName, attempt + 1);
      }

      const delayMs = exponentialBackoff
        ? retryDelayMs * 2 ** attempt
        : retryDelayMs;

      await sleep(delayMs);

      return this.retryableRequest(requestFn, operationName, attempt + 1);
    }
  }
}
