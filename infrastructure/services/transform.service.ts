/* eslint-disable no-console */

// Domain entities and types
import { ItemOverview } from '@domain/entities/item-overview.entity';
import { CurrencyItem } from '@domain/entities/currency-item.entity';
import { FlipTableRowDto } from '@infrastructure/dtos/flip-table.dto';

// Interfaces
import { CurrencyOverview } from '@domain/repositories/interfaces/data-storage.repository.interface';
import { IProfitCalculationService } from '@application/interfaces/services.interface';

/**
 * Result of transforming a single league
 */
export interface SingleLeagueTransformResult {
  flipTable: FlipTableRowDto[];
  currency: CurrencyOverview[];
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
   * @returns Transformed flip table and currency overview for the league
   */
  transformLeague(
    leagueName: string,
    items: ItemOverview[],
    currencyItems: CurrencyItem[],
  ): SingleLeagueTransformResult {
    console.log(`Transforming data for league: ${leagueName}`);

    const currency = currencyItems.map((item: CurrencyItem): CurrencyOverview => ({
      name: item.currencyTypeName,
      detailsId: '', // CurrencyItem doesn't have detailsId
      chaosEquivalent: item.chaosEquivalent,
    }));

    const flipTable = this.profitCalculationService.generateFlipTable(items);

    return { flipTable, currency };
  }
}
