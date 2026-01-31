import { ItemOverview } from '@domain/entities/item-overview.entity';
import { CurrencyItem } from '@domain/entities/currency-item.entity';
import { Card } from '@domain/entities/card.entity';
import { FlipTableRowDto } from '@infrastructure/dtos/flip-table.dto';

// Card matcher interface (Strategy Pattern)
export interface ICardMatcher {
  /**
   * Find matching divination card in league data
   */
  matchCard(
    leagueData: Array<ItemOverview | CurrencyItem>,
    cardName: string
  ): ItemOverview | null;

  /**
   * Find matching reward in league data
   * Note: Implementation specializes this method:
   * - ExactItemMatcher uses ItemCard
   * - ExactCurrencyMatcher uses CurrencyCard
   */
  matchReward(
    leagueData: Array<ItemOverview | CurrencyItem>,
    cardDetails: Card
  ): ItemOverview | CurrencyItem | null;
}

// Profit calculation service
export interface IProfitCalculationService {
  calculateCardProfit(
    leagueData: Array<ItemOverview | CurrencyItem>,
    card: Card
  ): FlipTableRowDto | null;

  generateFlipTable(
    leagueData: Array<ItemOverview | CurrencyItem>
  ): FlipTableRowDto[];
}

// Price conversion service
export interface IPriceConversionService {
  convertChaosToExalted(chaosValue: number, exaltedChaosEquivalent: number): number;
  getExaltedValue(leagueData: Array<ItemOverview | CurrencyItem>): number;
}
