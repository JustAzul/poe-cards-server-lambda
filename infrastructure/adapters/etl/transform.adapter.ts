/* eslint-disable no-console */

// Domain entities and types
import { ItemOverview } from '@domain/value-objects/item-overview';
import { CurrencyItem } from '@domain/value-objects/currency-item';
import { DivinationCard } from '@domain/entities/card.entity';
import { CardArbitrage } from '@domain/aggregates/card-arbitrage.aggregate';
import { ProfitTableRowDto } from '@infrastructure/dtos/profit-table-row.dto';
import { ArbitrageMapper } from '@infrastructure/mappers/arbitrage.mapper';

// Interfaces
import { IArbitrageEvaluator } from '@application/use-case/arbitrage-evaluator.use-case';

/**
 * Result of transforming a single league
 */
export interface SingleLeagueTransformResult {
  profitTable: ProfitTableRowDto[];
  currency: CurrencyItem[];
}

/**
 * ETL Pipeline Transform Adapter
 * Responsible for transforming raw league data
 * Processes raw data into structured arbitrage opportunities and currency results
 */
export class TransformAdapter {
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
    cards: DivinationCard[],
  ): SingleLeagueTransformResult {
    console.log(`Transforming data for league: ${leagueName}`);

    const leagueData = { items, currency: currencyItems };

    // Application layer returns domain aggregates
    const domainResults: CardArbitrage[] = this.arbitrageEvaluator.findAllArbitrageOpportunities(
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
