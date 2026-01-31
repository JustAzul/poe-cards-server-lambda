// ETL (Extract, Transform, Load) shared type definitions

import { ItemOverview } from '@domain/entities/item-overview.entity';
import { CurrencyItem } from '@domain/entities/currency-item.entity';
import { ProfitTableRowDto } from '@infrastructure/dtos/profit-table.dto';

/** Maps league names to their last update timestamp (ISO string) */
export type UpdateTimestamps = Record<string, string>;

/** Maps league names to their profit table results */
export type ProfitTableResults = Record<string, ProfitTableRowDto[]>;

/** Maps league names to their currency data */
export type CurrencyResultsMap = Record<string, CurrencyItem[]>;

/** League data with metadata */
export interface LeagueData {
  data: Array<ItemOverview | CurrencyItem>;
  timestamp: string;
}

/** Maps league names to their data and metadata */
export type LeagueDataMap = Record<string, LeagueData>;
