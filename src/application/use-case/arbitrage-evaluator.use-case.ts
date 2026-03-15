import { DivinationCard } from '@domain/entities/card.entity';
import { CardArbitrage } from '@domain/aggregates/card-arbitrage.aggregate';
import { ArbitrageEvaluatorService } from '@domain/services/arbitrage-evaluator.service';
import { ItemOverview } from '@domain/value-objects/item-overview';
import { CurrencyItem } from '@domain/value-objects/currency-item';

/**
 * League Data - Separated structure for items and currency
 * Items and currency kept in distinct arrays for type safety
 */
export interface LeagueData {
  league: string;
  items: ItemOverview[];
  currency: CurrencyItem[];
}

/**
 * Application Service Interface
 * Defines contracts for arbitrage evaluation
 */
export interface IArbitrageEvaluator {
  evaluateCardArbitrage(leagueData: LeagueData, card: DivinationCard): CardArbitrage | null;
  findAllArbitrageOpportunities(leagueData: LeagueData, cards: DivinationCard[]): CardArbitrage[];
}

/**
 * Application Service - Orchestrates domain services
 * Thin layer that delegates to domain services
 * Returns domain aggregates directly (no transformation)
 */
export class ArbitrageEvaluator implements IArbitrageEvaluator {
  constructor(
    private readonly domainService: ArbitrageEvaluatorService,
  ) {}

  /**
   * Evaluate single card for arbitrage opportunity
   */
  evaluateCardArbitrage(leagueData: LeagueData, card: DivinationCard): CardArbitrage | null {
    return this.domainService.evaluate(
      card,
      leagueData.items,
      leagueData.currency,
      leagueData.league,
    );
  }

  /**
   * Find all actionable arbitrage opportunities from cards
   */
  findAllArbitrageOpportunities(leagueData: LeagueData, cards: DivinationCard[]): CardArbitrage[] {
    return this.domainService.findAllOpportunities(
      cards,
      leagueData.items,
      leagueData.currency,
      leagueData.league,
    );
  }
}
