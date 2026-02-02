/* eslint-disable no-console */
import { ItemOverview } from '@domain/value-objects/item-overview';
import { CurrencyItem } from '@domain/value-objects/currency-item';
import {
  ItemOverviewApiResponse,
  CurrencyOverviewApiResponse,
} from '@infrastructure/types/poe-ninja.types';
import { LeagueApiResponse } from '@infrastructure/types/poe-api.types';
import { HttpClient } from '@infrastructure/adapters/http/http-client';

export interface IHttpService {
  /**
   * Fetch leagues from Path of Exile API
   * @returns Promise<LeagueApiResponse[]> - Array of league responses from API
   * @throws Error if API call fails after retries
   */
  fetchLeagues(): Promise<LeagueApiResponse[]>;

  /**
   * Fetch item overview from poe.ninja API
   * @param league - League name (e.g., "Standard", "Affliction")
   * @param type - Item type (e.g., "DivinationCard", "UniqueArmour")
   * @returns Promise<ItemOverview[]> - Array of item pricing data
   * @throws Error if API call fails after retries
   */
  fetchItemOverview(league: string, type: string): Promise<ItemOverview[]>;

  /**
   * Fetch currency overview from poe.ninja API
   * @param league - League name
   * @returns Promise<CurrencyItem[]> - Array of currency pricing data
   * @throws Error if API call fails after retries
   */
  fetchCurrencyOverview(league: string): Promise<CurrencyItem[]>;
}

/**
 * HTTP Service that coordinates API requests to different domains
 * Uses separate HttpClient instances to manage rate limiting independently
 */
export class HttpService implements IHttpService {
  private readonly poeApiClient: HttpClient;

  private readonly poeNinjaClient: HttpClient;

  constructor(
    poeApiClient?: HttpClient,
    poeNinjaClient?: HttpClient,
  ) {
    this.poeApiClient = poeApiClient || new HttpClient({ throttleDelayMs: 2000 });
    this.poeNinjaClient = poeNinjaClient || new HttpClient({ throttleDelayMs: 2000 });
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
    return response.lines;
  }

  async fetchCurrencyOverview(league: string): Promise<CurrencyItem[]> {
    const url = 'https://poe.ninja/api/data/currencyoverview';
    const searchParams = {
      league,
      type: 'Currency',
    };

    const response = await this.poeNinjaClient.get<CurrencyOverviewApiResponse>(url, searchParams);
    return response.lines;
  }
}

export const httpService = new HttpService();
