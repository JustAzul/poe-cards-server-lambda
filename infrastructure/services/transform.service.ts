/* eslint-disable no-console */

// Domain entities and types
import { ItemOverview, CurrencyItem } from '@domain/entities/http.entity';
import { FlipTableRowDto } from '@application/dtos/flip-table.dto';
import { isCurrencyItem } from '@domain/types';

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
   * @param data - Raw item and currency data for the league
   * @returns Transformed flip table and currency overview for the league
   */
  transformLeague(
    leagueName: string,
    data: Array<ItemOverview | CurrencyItem>,
  ): SingleLeagueTransformResult {
    console.log(`Transforming data for league: ${leagueName}`);

    const currency = data
      .filter(isCurrencyItem)
      .map((item: CurrencyItem): CurrencyOverview => ({
        Name: item.currencyTypeName,
        detailsId: '', // CurrencyItem doesn't have detailsId
        chaosEquivalent: item.chaosEquivalent,
      }));

    const flipTable = this.profitCalculationService.generateFlipTable(data);

    return { flipTable, currency };
  }
}
