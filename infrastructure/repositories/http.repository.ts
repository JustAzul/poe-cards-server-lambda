import got from 'got';
import { sleep } from 'azul-tools';
import { IHttpRepository } from '@domain/repositories/interfaces/http.repository.interface';
import {
  LeaguesRecord,
  LeagueApiResponse,
  ItemOverview,
  CurrencyItem,
  HttpRetryConfig,
  ItemOverviewApiResponse,
  CurrencyOverviewApiResponse,
} from '@domain/entities/http.entity';

export class HttpRepository implements IHttpRepository {
  private retryConfig: HttpRetryConfig = {
    maxRetries: 3,
    baseDelayMs: 2000,
    exponentialBackoff: true,
  };

  setRetryConfig(config: Partial<HttpRetryConfig>): void {
    this.retryConfig = { ...this.retryConfig, ...config };
  }

  async fetchLeagues(): Promise<LeaguesRecord> {
    const url = 'https://api.pathofexile.com/leagues';
    const searchParams = {
      type: 'main',
      compact: 0,
    };

    try {
      const { body } = await got<LeagueApiResponse[]>({
        url,
        searchParams,
        responseType: 'json',
      });

      // Filter and process leagues (same logic as fetch.js)
      const filteredLeagues = body
        .filter(({ id }) => id.indexOf('SSF') === -1)
        .filter(({ event }) => !event)
        .filter(({ realm }) => realm === 'pc')
        .filter(({ id }) => id !== 'Hardcore');

      const leagues: LeaguesRecord = {};
      for (const { id, url: ladder } of filteredLeagues) {
        leagues[id] = {
          leagueName: id,
          ladder,
        };
      }

      return leagues;
    } catch (error) {
      console.error('Failed to fetch leagues:', error);
      throw new Error(`Failed to fetch leagues: ${(error as Error).message}`);
    }
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
      `fetchItemOverview(${league}, ${type})`
    ).then(response => response.lines);
  }

  async fetchCurrencyOverview(league: string): Promise<CurrencyItem[]> {
    const url = 'https://poe.ninja/api/data/currencyoverview';
    const searchParams = {
      league,
      type: 'Currency',
    };

    return this.retryableRequest<CurrencyOverviewApiResponse>(
      () => got<CurrencyOverviewApiResponse>({ url, searchParams, responseType: 'json' }),
      `fetchCurrencyOverview(${league})`
    ).then(response => response.lines);
  }

  /**
   * Execute HTTP request with retry logic
   */
  private async retryableRequest<T>(
    requestFn: () => Promise<{ body: T }>,
    operationName: string,
    attempt: number = 0
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
        ? baseDelayMs * Math.pow(2, attempt)
        : baseDelayMs;

      console.warn(`${operationName} failed (attempt ${attempt + 1}/${maxRetries}), retrying in ${delayMs}ms...`);
      await sleep(delayMs);

      return this.retryableRequest(requestFn, operationName, attempt + 1);
    }
  }
}

export const httpRepository = new HttpRepository();
