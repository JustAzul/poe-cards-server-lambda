import { ItemOverview } from '@domain/value-objects/item-overview';
import { CurrencyItem } from '@domain/value-objects/currency-item';

// poe.ninja API - Item Overview Response
export interface ItemOverviewApiResponse {
  lines: ItemOverview[];
}

// poe.ninja API - Currency Overview Response
export interface CurrencyOverviewApiResponse {
  lines: CurrencyItem[];
}
