import { ItemOverview } from '@domain/entities/item-overview.entity';
import { CurrencyItem } from '@domain/entities/currency-item.entity';
import { CardDetailsDto } from '@application/dtos/flip-table.dto';
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
   */
  matchReward(
    leagueData: Array<ItemOverview | CurrencyItem>,
    cardDetails: CardDetailsDto
  ): ItemOverview | CurrencyItem | null;
}

// Profit calculation service
export interface IProfitCalculationService {
  calculateCardProfit(
    leagueData: Array<ItemOverview | CurrencyItem>,
    cardDetails: CardDetailsDto,
    isCurrency: boolean
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
