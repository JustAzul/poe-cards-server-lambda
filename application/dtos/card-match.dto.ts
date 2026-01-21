import { ItemOverview, CurrencyItem } from '@domain/entities/http.entity';

// Result of matching a card with its pricing data
export interface CardMatchResultDto {
  cardOverview: ItemOverview | null;
  rewardOverview: ItemOverview | CurrencyItem | null;
  isValid: boolean;
}
