// ETL (Extract, Transform, Load) shared type definitions

import { ItemOverview, CurrencyItem } from '@domain/entities/http.entity';
import { FlipTableRowDto } from '@application/dtos/flip-table.dto';
import { CurrencyOverview } from '@domain/repositories/interfaces/data-storage.repository.interface';

/** Maps league names to their last update timestamp (ISO string) */
export type UpdateTimestamps = Record<string, string>;

/** Maps league names to their flip table results */
export type FlipTableResults = Record<string, FlipTableRowDto[]>;

/** Maps league names to their currency data */
export type CurrencyResultsMap = Record<string, CurrencyOverview[]>;

/** League data with metadata */
export interface LeagueData {
  data: Array<ItemOverview | CurrencyItem>;
  timestamp: string;
}

/** Maps league names to their data and metadata */
export type LeagueDataMap = Record<string, LeagueData>;
