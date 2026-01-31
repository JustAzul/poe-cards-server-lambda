/* eslint-disable no-console */

// Domain entities and types
import { ItemOverview } from '@domain/entities/item-overview.entity';
import { CurrencyItem } from '@domain/entities/currency-item.entity';
import { Card } from '@domain/entities/card.entity';
import { FlipTableRowDto } from '@infrastructure/dtos/flip-table.dto';

// Interfaces
import { IProfitCalculationService } from '@application/interfaces/services.interface';

/**
 * Result of transforming a single league
 */
export interface SingleLeagueTransformResult {
  flipTable: FlipTableRowDto[];
  currency: CurrencyItem[];
}

/**
 * Service responsible for transforming raw league data
 * Processes raw data into structured flip tables and currency results
 */
export class TransformService {
  constructor(
    private readonly profitCalculationService: IProfitCalculationService,
  ) {}

  /**
   * Transform a single league's data into flip table and currency results
   *
   * @param leagueName - Name of the league being processed
   * @param items - Raw item data for the league
   * @param currencyItems - Raw currency data for the league
   * @param cards - Divination cards to process
   * @returns Transformed flip table and currency for the league
   */
  transformLeague(
    leagueName: string,
    items: ItemOverview[],
    currencyItems: CurrencyItem[],
    cards: Card[],
  ): SingleLeagueTransformResult {
    console.log(`Transforming data for league: ${leagueName}`);

    const leagueData = { items, currency: currencyItems };
    const flipTable = this.profitCalculationService.generateFlipTable(leagueData, cards);

    return { flipTable, currency: currencyItems };
  }
}
