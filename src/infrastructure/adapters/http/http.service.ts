import { ItemOverview } from '@domain/value-objects/item-overview';
import { CurrencyItem } from '@domain/value-objects/currency-item';
import { ILeagueApi, IMarketDataApi } from '@domain/ports/http-service.port';
import {
  ItemOverviewApiResponse,
  CurrencyOverviewApiResponse,
} from '@infrastructure/types/poe-ninja.types';
import { LeagueApiResponse } from '@infrastructure/types/poe-api.types';
import { HttpClient } from '@infrastructure/adapters/http/http-client';

/**
 * HTTP Service that coordinates API requests to different domains
 * Uses separate HttpClient instances to manage rate limiting independently
 */
export class HttpService implements ILeagueApi, IMarketDataApi {
  private readonly poeApiClient: HttpClient;

  private readonly poeNinjaClient: HttpClient;

  constructor(
    poeApiClient?: HttpClient,
    poeNinjaClient?: HttpClient,
  ) {
    this.poeApiClient = poeApiClient ?? new HttpClient({ throttleDelayMs: 2000 });
    this.poeNinjaClient = poeNinjaClient ?? new HttpClient({ throttleDelayMs: 2000 });
  }

  async fetchLeagues(): Promise<LeagueApiResponse[]> {
    const url = 'https://api.pathofexile.com/leagues';
    const searchParams = {
      type: 'main',
      compact: 0,
    };

    return this.poeApiClient.get<LeagueApiResponse[]>(url, searchParams);
  }

  async fetchItemOverview(league: string, type: string): Promise<ItemOverview[]> {
    console.log(`Requesting league '${league}' ${type}'s..`);

    const url = 'https://poe.ninja/api/data/itemoverview';
    const searchParams = {
      league,
      type,
      language: 'en',
    };

    const response = await this.poeNinjaClient.get<ItemOverviewApiResponse>(url, searchParams);
    return response.lines.map((line) => new ItemOverview(line));
  }

  async fetchCurrencyOverview(league: string): Promise<CurrencyItem[]> {
    const url = 'https://poe.ninja/api/data/currencyoverview';
    const searchParams = {
      league,
      type: 'Currency',
    };

    const response = await this.poeNinjaClient.get<CurrencyOverviewApiResponse>(url, searchParams);
    return response.lines.map((line) => new CurrencyItem(line));
  }
}
