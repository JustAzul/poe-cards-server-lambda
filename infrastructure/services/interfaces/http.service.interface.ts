import { ItemOverview } from '@domain/entities/item-overview.entity';
import { CurrencyItem } from '@domain/entities/currency-item.entity';
import type { LeagueApiResponse } from '@infrastructure/types/poe-api.types';

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
