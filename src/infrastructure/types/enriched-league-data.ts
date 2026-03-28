import { League } from '@domain/entities/league.entity';
import { ItemOverview } from '@domain/value-objects/item-overview';
import { CurrencyItem } from '@domain/value-objects/currency-item';
import { DivinationCardLine } from '@domain/services/reward-parser.service';
import { PoeNinjaItemMeta } from '@infrastructure/types/poe-ninja-item-meta';

/**
 * Complete league data yield from the market data adapter
 * Includes domain data, card-line parsing data, and presentation metadata
 */
export interface EnrichedLeagueDataYield {
  league: League;
  items: ItemOverview[];
  currency: CurrencyItem[];
  timestamp: string;
  error?: Error;
  cardLines: DivinationCardLine[];
  itemMeta: Map<string, PoeNinjaItemMeta>;
}
