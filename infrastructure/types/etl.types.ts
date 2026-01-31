// ETL (Extract, Transform, Load) shared type definitions

import { ItemOverview } from '@domain/entities/item-overview.entity';
import { CurrencyItem } from '@domain/entities/currency-item.entity';
import { FlipTableRowDto } from '@infrastructure/dtos/flip-table.dto';

/** Maps league names to their last update timestamp (ISO string) */
export type UpdateTimestamps = Record<string, string>;

/** Maps league names to their flip table results */
export type FlipTableResults = Record<string, FlipTableRowDto[]>;

/** Maps league names to their currency data */
export type CurrencyResultsMap = Record<string, CurrencyItem[]>;

/** League data with metadata */
export interface LeagueData {
  data: Array<ItemOverview | CurrencyItem>;
  timestamp: string;
}

/** Maps league names to their data and metadata */
export type LeagueDataMap = Record<string, LeagueData>;
