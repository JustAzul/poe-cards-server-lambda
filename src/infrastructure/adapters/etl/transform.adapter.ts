// Domain entities and types
import { ItemOverview } from '@domain/value-objects/item-overview';
import { CurrencyItem } from '@domain/value-objects/currency-item';
import { DivinationCard } from '@domain/entities/card.entity';
import { ArbitrageOpportunity } from '@domain/aggregates/arbitrage-opportunity';
import { ProfitTableRowDto } from '@infrastructure/dtos/profit-table-row.dto';
import { ArbitrageMapper } from '@infrastructure/mappers/arbitrage.mapper';

// Interfaces
import { IArbitrageEvaluator } from '@domain/ports/arbitrage-evaluator.port';
import { Logger } from '@shared/logger';

/**
 * Result of transforming a single league
 */
export interface SingleLeagueTransformResult {
  profitTable: ProfitTableRowDto[];
  currency: CurrencyItem[];
}

export interface ITransformAdapter {
  transform(
    leagueName: string,
    items: ItemOverview[],
    currencyItems: CurrencyItem[],
    cards: DivinationCard[],
  ): SingleLeagueTransformResult;
}

/**
 * ETL Pipeline Transform Adapter
 * Responsible for transforming raw league data
 * Processes raw data into structured arbitrage opportunities and currency results
 */
export class TransformAdapter implements ITransformAdapter {
  constructor(
    private readonly arbitrageEvaluator: IArbitrageEvaluator,
    private readonly logger: Logger = console,
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
    this.logger.log(`Transforming data for league: ${leagueName}`);

    const leagueData = { league: leagueName, items, currency: currencyItems };

    // Application layer returns domain aggregates
    const domainResults: ArbitrageOpportunity[] = this.arbitrageEvaluator
      .findAllArbitrageOpportunities(leagueData, cards);

    // Infrastructure layer maps domain → DTO at architectural boundary
    const profitTable: ProfitTableRowDto[] = domainResults.map(
      (result) => ArbitrageMapper.toDto(result),
    );

    return { profitTable, currency: currencyItems };
  }
}
