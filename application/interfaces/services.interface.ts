import { ItemOverview } from '@domain/entities/item-overview.entity';
import { CurrencyItem } from '@domain/entities/currency-item.entity';
import { CardDetailsDto } from '@application/dtos/flip-table.dto';
import { FlipTableRowDto } from '@infrastructure/dtos/flip-table.dto';
import { CardMatchResultDto } from '@application/dtos/card-match.dto';

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
