import { ItemOverview } from '@domain/value-objects/item-overview';
import { CurrencyItem } from '@domain/value-objects/currency-item';
import { IMarketDataApi } from '@domain/ports/http-service.port';
import {
  ItemOverviewApiResponse,
  CurrencyOverviewApiResponse,
} from '@infrastructure/types/poe-ninja.types';
import { HttpClient } from '@infrastructure/adapters/http/http-client';
import { Logger } from '@shared/logger';

const DEFAULT_THROTTLE_DELAY_MS = 2000;

export class PoeNinjaService implements IMarketDataApi {
  constructor(
    private readonly client: HttpClient = new HttpClient(
      { throttleDelayMs: DEFAULT_THROTTLE_DELAY_MS },
    ),
    private readonly logger: Logger = console,
  ) {}

  async fetchItemOverview(league: string, type: string): Promise<ItemOverview[]> {
    const url = 'https://poe.ninja/poe1/api/economy/stash/current/item/overview';
    const response = await this.client.get<ItemOverviewApiResponse>(url, {
      league,
      type,
      language: 'en',
    });

    if (!Array.isArray(response.lines)) {
      this.logger.warn(`[PoeNinjaService] Unexpected response shape for ${type}: missing 'lines' array`);
      return [];
    }

    return response.lines
      .filter((line) => typeof line.name === 'string'
        && typeof line.chaosValue === 'number'
        && !Number.isNaN(line.chaosValue))
      .map((line) => new ItemOverview(line));
  }

  async fetchCurrencyOverview(league: string): Promise<CurrencyItem[]> {
    const url = 'https://poe.ninja/poe1/api/economy/stash/current/currency/overview';
    const response = await this.client.get<CurrencyOverviewApiResponse>(url, {
      league,
      type: 'Currency',
    });

    if (!Array.isArray(response.lines)) {
      this.logger.warn('[PoeNinjaService] Unexpected response shape for Currency: missing \'lines\' array');
      return [];
    }

    return response.lines
      .filter((line) => typeof line.currencyTypeName === 'string'
        && typeof line.chaosEquivalent === 'number'
        && !Number.isNaN(line.chaosEquivalent))
      .map((line) => new CurrencyItem(line));
  }
}
