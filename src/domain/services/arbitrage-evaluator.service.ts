import { DivinationCard } from '@domain/entities/card.entity';
import { CardArbitrage } from '@domain/aggregates/card-arbitrage.aggregate';
import { MarketSnapshot } from '@domain/value-objects/market-snapshot';
import { ItemOverview } from '@domain/value-objects/item-overview';
import { CurrencyItem } from '@domain/value-objects/currency-item';
import { RewardMatcherService } from '@domain/services/reward-matcher.service';
import { ArbitrageCalculationService } from '@domain/services/arbitrage-calculation.service';
import { TrustValidationService } from '@domain/services/trust-validation.service';

/**
 * Arbitrage Evaluator Domain Service
 * Orchestrates domain services to evaluate arbitrage opportunities
 * Coordinates reward matching, profit calculation, and trust validation
 * Returns complete CardArbitrage aggregates
 */
export class ArbitrageEvaluatorService {
  private readonly MIN_TRUST_COUNT = 10;

  constructor(
    private readonly rewardMatcher: RewardMatcherService,
    private readonly calculator: ArbitrageCalculationService,
    private readonly trustValidator: TrustValidationService,
  ) {}

  /**
   * Evaluate a single card for arbitrage opportunity
   * Returns aggregate if opportunity meets all domain constraints, null otherwise
   */
  evaluate(
    card: DivinationCard,
    items: ItemOverview[],
    currency: CurrencyItem[],
    leagueId: string,
  ): CardArbitrage | null {
    // Find prices in market data
    const cardPrice = this.rewardMatcher.findCardPrice(items, card.name);
    const rewardPrice = this.rewardMatcher.findRewardPrice(items, currency, card);

    if (!cardPrice || !rewardPrice) return null;

    // Create market snapshot
    const market = MarketSnapshot.create(cardPrice, rewardPrice, leagueId);

    // Validate trust
    const trust = this.trustValidator.validateCardRewardTrust(
      cardPrice,
      rewardPrice,
      this.MIN_TRUST_COUNT,
    );

    if (!trust.isValid) return null;

    // Calculate profit
    const profit = this.calculator.calculateProfit(card, market);

    // Create and return aggregate
    return CardArbitrage.create(card, market, profit, trust);
  }

  /**
   * Find all actionable arbitrage opportunities from a list of cards
   * Filters out opportunities that are not both trusted and profitable
   */
  findAllOpportunities(
    cards: DivinationCard[],
    items: ItemOverview[],
    currency: CurrencyItem[],
    leagueId: string,
  ): CardArbitrage[] {
    return cards
      .map((card) => this.evaluate(card, items, currency, leagueId))
      .filter((arb): arb is CardArbitrage => arb !== null && arb.isActionable());
  }
}
