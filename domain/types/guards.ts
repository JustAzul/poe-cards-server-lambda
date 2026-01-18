import { ItemOverview, CurrencyItem } from '@domain/entities/http.entity';

/**
 * Type guard to check if an item is a CurrencyItem
 */
export function isCurrencyItem(item: ItemOverview | CurrencyItem): item is CurrencyItem {
  return 'currencyTypeName' in item;
}
