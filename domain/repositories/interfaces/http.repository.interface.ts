import { LeaguesRecord, ItemOverview, CurrencyItem, HttpRetryConfig } from '@domain/entities/http.entity';

export interface IHttpRepository {
  /**
   * Fetch leagues from Path of Exile API
   * @returns Promise<LeaguesRecord> - Filtered and processed leagues
   * @throws Error if API call fails after retries
   */
  fetchLeagues(): Promise<LeaguesRecord>;

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

  /**
   * Configure retry behavior for HTTP requests
   * @param config - Retry configuration
   */
  setRetryConfig(config: Partial<HttpRetryConfig>): void;
}
