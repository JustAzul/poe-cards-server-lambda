import { ItemOverview } from '@domain/entities/item-overview.entity';
import { CurrencyItem } from '@domain/entities/currency-item.entity';

// Result of matching a card with its pricing data
export interface CardMatchResultDto {
  cardOverview: ItemOverview | null;
  rewardOverview: ItemOverview | CurrencyItem | null;
  isValid: boolean;
}
