import { ItemOverview } from '@domain/value-objects/item-overview';
import { PoeNinjaItemLine } from '@infrastructure/types/poe-ninja.types';

/**
 * Port for fetching market data (items and currency) from poe.ninja API,
 * including the raw item lines used by the league adapter for divination
 * card extraction.
 */
export interface IMarketDataApiWithRaw {
  /**
   * Fetch item overview from poe.ninja API
   * @param league - League name (e.g., "Standard", "Affliction")
   * @param type - Item type (e.g., "DivinationCard", "UniqueArmour")
   * @returns Promise<ItemOverview[]> - Array of item pricing data
   * @throws Error if API call fails after retries
   */
  fetchItemOverview(league: string, type: string): Promise<ItemOverview[]>;

  fetchRawItemLines(league: string, type: string): Promise<PoeNinjaItemLine[]>;
}
