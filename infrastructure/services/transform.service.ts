/* eslint-disable no-console */

// Domain entities and types
import { ItemOverview } from '@domain/entities/item-overview.entity';
import { CurrencyItem } from '@domain/entities/currency-item.entity';
import { Card } from '@domain/entities/card.base.entity';
import { Arbitrage } from '@domain/models/arbitrage';
import { ProfitTableRowDto } from '@infrastructure/dtos/profit-table.dto';
import { ArbitrageMapper } from '@infrastructure/mappers/arbitrage.mapper';

// Interfaces
import { IArbitrageEvaluator } from '@application/interfaces/services.interface';

/**
 * Result of transforming a single league
 */
export interface SingleLeagueTransformResult {
  profitTable: ProfitTableRowDto[];
  currency: CurrencyItem[];
}

/**
 * Service responsible for transforming raw league data
 * Processes raw data into structured arbitrage opportunities and currency results
 */
export class TransformService {
  constructor(
    private readonly arbitrageEvaluator: IArbitrageEvaluator,
  ) {}

  /**
   * Transform a single league's data into profit table and currency results
   *
   * @param leagueName - Name of the league being processed
   * @param items - Raw item data for the league
   * @param currencyItems - Raw currency data for the league
   * @param cards - Divination cards to process
   * @returns Transformed profit table and currency for the league
   */
  transform(
    leagueName: string,
    items: ItemOverview[],
    currencyItems: CurrencyItem[],
    cards: Card[],
  ): SingleLeagueTransformResult {
    console.log(`Transforming data for league: ${leagueName}`);

    const leagueData = { items, currency: currencyItems };

    // Application layer returns domain models
    const domainResults: Arbitrage[] = this.arbitrageEvaluator.findAllArbitrageOpportunities(
      leagueData,
      cards,
    );

    // Infrastructure layer maps domain → DTO at architectural boundary
    const profitTable: ProfitTableRowDto[] = domainResults.map(
      (result) => ArbitrageMapper.toDto(result),
    );

    return { profitTable, currency: currencyItems };
  }
}
