import { ItemOverview } from '@domain/entities/item-overview.entity';
import { CurrencyItem } from '@domain/entities/currency-item.entity';

/**
 * Type guard to check if an item is a CurrencyItem
 */
export function isCurrencyItem(item: ItemOverview | CurrencyItem): item is CurrencyItem {
  return 'currencyTypeName' in item;
}
