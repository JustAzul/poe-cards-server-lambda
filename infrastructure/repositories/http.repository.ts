import got from 'got';
import { sleep } from '@shared/utils';
import { IHttpClient } from '@domain/repositories/interfaces/http.repository.interface';
import {
  ItemOverview,
  CurrencyItem,
  HttpRetryConfig,
  ItemOverviewApiResponse,
  CurrencyOverviewApiResponse,
} from '@domain/entities/http.entity';

export interface LeagueApiResponse {
  id: string;
  name: string;
  realm: string;
  url: string;
  startAt: string | null;
  endAt: string | null;
  description: string;
  category: {
    id: string;
  };
  registerAt?: string;
  delveEvent: boolean;
  rules: Array<{
    id: string;
    name: string;
    description: string;
  }>;
}

export class HttpClient implements IHttpClient {
  private retryConfig: HttpRetryConfig = {
    maxRetries: 3,
    baseDelayMs: 2000,
    exponentialBackoff: true,
  };

  async fetchLeagues(): Promise<LeagueApiResponse[]> {
    const url = 'https://api.pathofexile.com/leagues';
    const searchParams = {
      type: 'main',
      compact: 0,
    };

    const { body } = await got<LeagueApiResponse[]>({
      url,
      searchParams,
      responseType: 'json',
    });

    return body;
  }

  async fetchItemOverview(league: string, type: string): Promise<ItemOverview[]> {
    const url = 'https://poe.ninja/api/data/itemoverview';
    const searchParams = {
      league,
      type,
      language: 'en',
    };

    return this.retryableRequest<ItemOverviewApiResponse>(
      () => got<ItemOverviewApiResponse>({ url, searchParams, responseType: 'json' }),
      `fetchItemOverview(${league}, ${type})`,
    ).then((response) => response.lines);
  }

  async fetchCurrencyOverview(league: string): Promise<CurrencyItem[]> {
    const url = 'https://poe.ninja/api/data/currencyoverview';
    const searchParams = {
      league,
      type: 'Currency',
    };

    return this.retryableRequest<CurrencyOverviewApiResponse>(
      () => got<CurrencyOverviewApiResponse>({ url, searchParams, responseType: 'json' }),
      `fetchCurrencyOverview(${league})`,
    ).then((response) => response.lines);
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

export const httpRepository = new HttpClient();
