import got from 'got';
import { sleep } from '@shared/utils';
import { HttpRetryConfig } from '@domain/entities/http.entity';

/**
 * HTTP Client with built-in rate limiting and request queue
 * Each instance manages rate limiting for a single domain
 */
export class HttpClient {
  private lastRequestTime: number | null = null;

  private requestQueue: Array<() => Promise<void>> = [];

  private isProcessingQueue: boolean = false;

  constructor(
    private readonly domain: string,
    private readonly rateLimitDelayMs: number = 2000,
    private readonly retryConfig: HttpRetryConfig = {
      maxRetries: 3,
      baseDelayMs: 2000,
      exponentialBackoff: true,
    },
  ) {}

  /**
   * Make an HTTP GET request with rate limiting and retry logic
   * Requests are queued and executed sequentially with rate limiting
   */
  async get<T>(url: string, searchParams?: Record<string, any>): Promise<T> {
    return new Promise((resolve, reject) => {
      const requestTask = async () => {
        try {
          await this.enforceRateLimit();
          const result = await this.retryableRequest<T>(
            () => got<T>({ url, searchParams, responseType: 'json' }),
            `GET ${url}`,
          );
          resolve(result);
        } catch (error) {
          reject(error);
        }
      };

      this.enqueueRequest(requestTask);
    });
  }

  /**
   * Add a request to the queue and start processing if not already running
   */
  private enqueueRequest(requestTask: () => Promise<void>): void {
    this.requestQueue.push(requestTask);

    if (!this.isProcessingQueue) {
      this.processQueue();
    }
  }

  /**
   * Process queued requests sequentially
   */
  private async processQueue(): Promise<void> {
    this.isProcessingQueue = true;

    while (this.requestQueue.length > 0) {
      const task = this.requestQueue.shift();
      if (task) {
        await task();
      }
    }

    this.isProcessingQueue = false;
  }

  /**
   * Enforce rate limiting by waiting if necessary
   * Tracks last request time and ensures minimum delay between requests
   */
  private async enforceRateLimit(): Promise<void> {
    if (this.lastRequestTime !== null) {
      const timeSinceLastRequest = Date.now() - this.lastRequestTime;
      const remainingDelay = this.rateLimitDelayMs - timeSinceLastRequest;

      if (remainingDelay > 0) {
        console.log(`Rate limiting [${this.domain}]: waiting ${remainingDelay}ms...`);
        await sleep(remainingDelay);
      }
    }

    this.lastRequestTime = Date.now();
  }

  /**
   * Execute HTTP request with retry logic
   */
  private async retryableRequest<T>(
    requestFn: () => Promise<{ body: T }>,
    operationName: string,
    attempt: number = 0,
  ): Promise<T> {
    try {
      const { body } = await requestFn();
      return body;
    } catch (error) {
      const { maxRetries, baseDelayMs, exponentialBackoff } = this.retryConfig;

      if (attempt >= maxRetries) {
        console.error(`${operationName} failed after ${maxRetries} retries:`, error);
        throw new Error(`${operationName} failed: ${(error as Error).message}`);
      }

      const delayMs = exponentialBackoff
        ? baseDelayMs * 2 ** attempt
        : baseDelayMs;

      console.warn(`${operationName} failed (attempt ${attempt + 1}/${maxRetries}), retrying in ${delayMs}ms...`);
      await sleep(delayMs);

      return this.retryableRequest(requestFn, operationName, attempt + 1);
    }
  }
}
