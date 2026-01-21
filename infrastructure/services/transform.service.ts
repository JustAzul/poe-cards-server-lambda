/* eslint-disable no-console */

// Domain entities and types
import { ItemOverview, CurrencyItem } from '@domain/entities/http.entity';
import { FlipTableRowDto } from '@application/dtos/flip-table.dto';
import { isCurrencyItem } from '@domain/types';

// Interfaces
import { CurrencyOverview } from '@domain/repositories/interfaces/data-storage.repository.interface';
import { IProfitCalculationService } from '@application/interfaces/services.interface';

// Infrastructure types
import {
  FlipTableResults,
  CurrencyResultsMap,
  LeagueDataMap,
} from '@infrastructure/types/etl.types';

/**
 * Result of the transformation phase
 */
export interface TransformationResult {
  tableResults: FlipTableResults;
  currencyResults: CurrencyResultsMap;
}

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

  /**
   * Transform raw league data into structured results (batch processing)
   *
   * Processes raw data to generate flip tables and currency overviews
   * for each league
   *
   * @deprecated Use transformLeague() for incremental processing
   */
  async transform(rawData: LeagueDataMap): Promise<TransformationResult> {
    console.log('Generating tables and mapping results...');

    const tableResults: FlipTableResults = {};
    const currencyResults: CurrencyResultsMap = {};

    const leagueNames = Object.keys(rawData);

    // Process all leagues using array methods
    leagueNames.forEach((leagueName) => {
      const leagueData = rawData[leagueName].data;

      currencyResults[leagueName] = leagueData
        .filter(isCurrencyItem)
        .map((Item: CurrencyItem): CurrencyOverview => ({
          Name: Item.currencyTypeName,
          detailsId: '', // CurrencyItem doesn't have detailsId
          chaosEquivalent: Item.chaosEquivalent,
        })) as CurrencyOverview[];

      tableResults[leagueName] = this.profitCalculationService
        .generateFlipTable(leagueData);
    });

    return { tableResults, currencyResults };
  }
}
