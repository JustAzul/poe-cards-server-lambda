import { LeagueApiResponse } from '@infrastructure/types/poe-api.types';
import { ItemOverview } from '@domain/value-objects/item-overview';
import { CurrencyItem } from '@domain/value-objects/currency-item';

/**
 * Port for fetching league listings from the Path of Exile API
 */
export interface ILeagueApi {
  /**
   * Fetch leagues from Path of Exile API
   * @returns Promise<LeagueApiResponse[]> - Array of league responses from API
   * @throws Error if API call fails after retries
   */
  fetchLeagues(): Promise<LeagueApiResponse[]>;
}

/**
 * Port for fetching market data (items and currency) from poe.ninja API
 */
export interface IMarketDataApi {
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
