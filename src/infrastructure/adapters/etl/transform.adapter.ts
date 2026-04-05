// Domain entities and types
import { ItemOverview } from '@domain/value-objects/item-overview';
import { CurrencyItem } from '@domain/value-objects/currency-item';
import { DivinationCard } from '@domain/entities/card.entity';
import { ArbitrageOpportunity } from '@domain/aggregates/arbitrage-opportunity';
import { ProfitTableRowDto } from '@infrastructure/dtos/profit-table-row.dto';
import { ArbitrageMapper } from '@infrastructure/mappers/arbitrage.mapper';
import { PoeNinjaItemMeta } from '@infrastructure/types/poe-ninja-item-meta';

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
    itemMeta: Map<string, PoeNinjaItemMeta>,
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
    private readonly logger: Logger,
  ) {}

  /**
   * Transform a single league's data into profit table and currency results
   */
  transform(
    leagueName: string,
    items: ItemOverview[],
    currencyItems: CurrencyItem[],
    cards: DivinationCard[],
    itemMeta: Map<string, PoeNinjaItemMeta>,
  ): SingleLeagueTransformResult {
    this.logger.log(`Transforming data for league: ${leagueName}`);

    const leagueData = { league: leagueName, items, currency: currencyItems };

    // Application layer returns domain aggregates
    const domainResults: ArbitrageOpportunity[] = this.arbitrageEvaluator
      .findAllArbitrageOpportunities(leagueData, cards);

    // Infrastructure layer maps domain → DTO at architectural boundary
    const profitTable: ProfitTableRowDto[] = domainResults.map(
      (result) => ArbitrageMapper.toDto(result, itemMeta.get(result.card.name)),
    );

    return { profitTable, currency: currencyItems };
  }
}
