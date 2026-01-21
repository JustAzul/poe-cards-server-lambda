/* eslint-disable no-console */

// Domain entities and types
import { ItemOverview, CurrencyItem } from '@domain/entities/http.entity';
import { isCurrencyItem } from '@domain/types';

// DTOs
import { FlipTableRowDto } from '@application/dtos/flip-table.dto';

// Interfaces
import { CurrencyOverview } from '@domain/repositories/interfaces/data-storage.repository.interface';
import { IProfitCalculationService } from '@application/interfaces/services.interface';

/** Maps league names to their flip table results */
type FlipTableResults = Record<string, FlipTableRowDto[]>;

/** Maps league names to their currency data */
type CurrencyResultsMap = Record<string, CurrencyOverview[]>;

/** League data combining items and currency */
type LeagueDataMap = Record<string, Array<ItemOverview | CurrencyItem>>;

/**
 * Result of the transformation phase
 */
export interface TransformationResult {
  tableResults: FlipTableResults;
  currencyResults: CurrencyResultsMap;
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
   * Transform raw league data into structured results
   *
   * Processes raw data to generate flip tables and currency overviews
   * for each league
   */
  async transform(rawData: LeagueDataMap): Promise<TransformationResult> {
    console.log('Generating tables and mapping results...');

    const tableResults: FlipTableResults = {};
    const currencyResults: CurrencyResultsMap = {};

    const leagueNames = Object.keys(rawData);

    // Process all leagues using array methods
    leagueNames.forEach((leagueName) => {
      currencyResults[leagueName] = rawData[leagueName]
        .filter(isCurrencyItem)
        .map((Item: CurrencyItem): CurrencyOverview => ({
          Name: Item.currencyTypeName,
          detailsId: '', // CurrencyItem doesn't have detailsId
          chaosEquivalent: Item.chaosEquivalent,
        })) as CurrencyOverview[];

      tableResults[leagueName] = this.profitCalculationService
        .generateFlipTable(rawData[leagueName]);
    });

    return { tableResults, currencyResults };
  }
}
