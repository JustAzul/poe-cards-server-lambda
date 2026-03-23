import { DivinationCard } from '@domain/entities/card.entity';
import { ArbitrageOpportunity } from '@domain/aggregates/arbitrage-opportunity';
import { MarketSnapshot } from '@domain/value-objects/market-snapshot';
import { RewardMatcherService, MarketIndex } from '@domain/services/reward-matcher.service';
import { ArbitrageCalculationService } from '@domain/services/arbitrage-calculation.service';
import { TrustValidationService } from '@domain/services/trust-validation.service';
import { IArbitrageEvaluator, LeagueData } from '@domain/ports/arbitrage-evaluator.port';
import { Logger } from '@shared/logger';

/**
 * Arbitrage Evaluator Domain Service
 * Orchestrates domain services to evaluate arbitrage opportunities
 * Coordinates reward matching, profit calculation, and trust validation
 * Returns complete ArbitrageOpportunity aggregates
 */
export class ArbitrageEvaluatorService implements IArbitrageEvaluator {
  private readonly MIN_TRUST_COUNT = 10;

  constructor(
    private readonly rewardMatcher: RewardMatcherService,
    private readonly calculator: ArbitrageCalculationService,
    private readonly trustValidator: TrustValidationService,
    private readonly logger: Logger = console,
  ) {}

  /**
   * Evaluate a single card for arbitrage opportunity
   * Returns aggregate if opportunity meets all domain constraints, null otherwise
   */
  private evaluate(
    card: DivinationCard,
    index: MarketIndex,
    leagueId: string,
  ): ArbitrageOpportunity | null {
    // Find prices in market data
    const cardPrice = this.rewardMatcher.findCardPrice(index, card.name);
    const rewardPrice = this.rewardMatcher.findRewardPrice(index, card);

    if (!cardPrice) {
      this.logger.warn(`[ArbitrageEvaluator] Skipped "${card.name}": card not found in market data`);
      return null;
    }

    if (!rewardPrice) {
      this.logger.warn(`[ArbitrageEvaluator] Skipped "${card.name}": reward not found in market data`);
      return null;
    }

    // Create market snapshot
    const market = new MarketSnapshot({ cardPrice, rewardPrice, leagueId });

    // Validate trust
    const trust = this.trustValidator.validateCardRewardTrust(
      cardPrice,
      rewardPrice,
      this.MIN_TRUST_COUNT,
    );

    if (!trust.isValid) {
      this.logger.warn(`[ArbitrageEvaluator] Skipped "${card.name}": ${trust.reason ?? 'trust validation failed'}`);
      return null;
    }

    // Calculate profit (null if stackSize is missing)
    const profit = this.calculator.calculateProfit(card, market);
    if (!profit) {
      this.logger.warn(`[ArbitrageEvaluator] Skipped "${card.name}": missing stackSize`);
      return null;
    }

    // Create and return aggregate
    return new ArbitrageOpportunity({
      card, market, profit, trust,
    });
  }

  /**
   * Evaluate a single card for arbitrage opportunity (IArbitrageEvaluator port)
   * Builds a fresh MarketIndex on each call — intended for single-card lookups (e.g. tests).
   * For batch evaluation, use findAllArbitrageOpportunities() which builds the index once.
   */
  evaluateCardArbitrage(leagueData: LeagueData, card: DivinationCard): ArbitrageOpportunity | null {
    const index = this.rewardMatcher.buildIndex(leagueData.items, leagueData.currency);
    return this.evaluate(card, index, leagueData.league);
  }

  /**
   * Find all actionable arbitrage opportunities (IArbitrageEvaluator port)
   * Builds a market index once, then evaluates all cards against it
   */
  findAllArbitrageOpportunities(
    leagueData: LeagueData,
    cards: DivinationCard[],
  ): ArbitrageOpportunity[] {
    const index = this.rewardMatcher.buildIndex(leagueData.items, leagueData.currency);
    return cards
      .map((card) => this.evaluate(card, index, leagueData.league))
      .filter((arb): arb is ArbitrageOpportunity => arb !== null && arb.isActionable());
  }
}
