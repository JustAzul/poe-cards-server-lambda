import { ItemOverview } from '@domain/value-objects/item-overview';

/**
 * Domain-level representation of raw league data from the API.
 * Contains only the fields the domain needs to construct League entities.
 */
export interface RawLeagueData {
  name: string;
  url: string;
  delveEvent: boolean;
  realm: string;
  startAt: string | null;
  endAt: string | null;
  rules: Array<{ id: string }>;
}

/**
 * Port for fetching league listings from the Path of Exile API
 */
export interface ILeagueApi {
  /**
   * Fetch leagues from Path of Exile API
   * @returns Promise<RawLeagueData[]> - Array of league data from API
   * @throws Error if API call fails after retries
   */
  fetchLeagues(): Promise<RawLeagueData[]>;
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
}
