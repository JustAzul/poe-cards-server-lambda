import { ItemOverview } from '@domain/entities/item-overview.entity';
import { CurrencyItem } from '@domain/entities/currency-item.entity';
import { Card } from '@domain/entities/card.entity';
import { FlipTableRowDto } from '@infrastructure/dtos/flip-table.dto';

/**
 * Separated league data structure
 * Items and currency kept in distinct arrays for type safety
 */
export interface LeagueData {
  items: ItemOverview[];
  currency: CurrencyItem[];
}

// Card matcher interface (Strategy Pattern)
export interface ICardMatcher {
  /**
   * Find matching divination card in items
   */
  matchCard(
    items: ItemOverview[],
    cardName: string
  ): ItemOverview | null;

  /**
   * Find matching reward in league data
   * Uses card type discriminator to determine matching strategy
   */
  matchReward(
    items: ItemOverview[],
    currency: CurrencyItem[],
    cardDetails: Card
  ): ItemOverview | CurrencyItem | null;
}

// Profit calculation service
export interface IProfitCalculationService {
  calculateCardProfit(
    leagueData: LeagueData,
    card: Card
  ): FlipTableRowDto | null;

  buildFlipTable(
    leagueData: LeagueData,
    cards: Card[]
  ): FlipTableRowDto[];
}

// Price conversion service
export interface IPriceConversionService {
  convertChaosToExalted(chaosValue: number, exaltedChaosEquivalent: number): number;
  getExaltedValue(leagueData: Array<ItemOverview | CurrencyItem>): number;
}
