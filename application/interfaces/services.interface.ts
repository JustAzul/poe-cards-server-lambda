import { ItemOverview, CurrencyItem } from '@domain/entities/http.entity';
import { CardDetailsDto, FlipTableRowDto } from '@application/dtos/flip-table.dto';
import { CardMatchResultDto } from '@application/dtos/card-match.dto';

// Price conversion service
export interface IPriceConversionService {
  convertChaosToExalted(chaosValue: number, exaltedChaosEquivalent: number): number;
  getExaltedValue(leagueData: Array<ItemOverview | CurrencyItem>): number;
}

// Card matching service
export interface ICardMatchingService {
  findCardMatch(
    leagueData: Array<ItemOverview | CurrencyItem>,
    cardDetails: CardDetailsDto,
    isCurrency: boolean
  ): CardMatchResultDto;
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
