/* eslint-disable no-console */
import { IHttpService } from '@domain/services/interfaces/http.service.interface';
import {
  ItemOverview,
  CurrencyItem,
  ItemOverviewApiResponse,
  CurrencyOverviewApiResponse,
} from '@domain/entities/http.entity';
import { HttpClient } from '@infrastructure/http/http-client';

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

/**
 * HTTP Service that coordinates API requests to different domains
 * Uses separate HttpClient instances to manage rate limiting independently
 */
export class HttpService implements IHttpService {
  private readonly poeApiClient: HttpClient;

  private readonly poeNinjaClient: HttpClient;

  constructor() {
    this.poeApiClient = new HttpClient(2000);
    this.poeNinjaClient = new HttpClient(2000);
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
