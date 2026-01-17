import { ItemOverview, CurrencyItem } from '@domain/entities/http.entity';

// Result of matching a card with its pricing data
export interface CardMatchResultDto {
  cardOverview: ItemOverview | null;
  rewardOverview: ItemOverview | CurrencyItem | null;
  isValid: boolean;
}

// Price calculation result
export interface PriceCalculationDto {
  chaosCost: number;
  exaltedCost: number;
  chaosReward: number;
  exaltedReward: number;
  chaosProfit: number;
}
