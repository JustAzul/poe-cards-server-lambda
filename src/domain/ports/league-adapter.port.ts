import { League } from '@domain/entities/league.entity';
import { ItemOverview } from '@domain/value-objects/item-overview';
import { CurrencyItem } from '@domain/value-objects/currency-item';

/**
 * Individual league data result yielded by generator
 */
export interface LeagueDataYield {
  league: League;
  items: ItemOverview[];
  currency: CurrencyItem[];
  timestamp: string;
}

/**
 * League Data Adapter Interface
 * Defines contract for adapting HTTP service to fetch league data
 */
export interface ILeagueAdapter {
  fetchBatchLeagueOverview(leagues: League[]): AsyncGenerator<LeagueDataYield>;
}
