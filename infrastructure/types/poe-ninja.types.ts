import { ItemOverview } from '@domain/entities/item-overview.entity';
import { CurrencyItem } from '@domain/entities/currency-item.entity';

// poe.ninja API - Item Overview Response
export interface ItemOverviewApiResponse {
  lines: ItemOverview[];
}

// poe.ninja API - Currency Overview Response
export interface CurrencyOverviewApiResponse {
  lines: CurrencyItem[];
}
