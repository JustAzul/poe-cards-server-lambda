import { DivinationCard } from '@domain/entities/card.entity';
import { MarketSnapshot } from '@domain/value-objects/market-snapshot';
import { ProfitResult } from '@domain/value-objects/profit-result';
import { TrustValidation } from '@domain/value-objects/trust-validation';

/**
 * Card Arbitrage Aggregate Root
 * Represents a complete arbitrage opportunity with all related data
 * Enforces consistency boundaries and domain rules
 * Aggregate = (Card entity + MarketSnapshot + ProfitResult + TrustValidation)
 */
export class CardArbitrage {
  readonly card: DivinationCard;

  readonly market: MarketSnapshot;

  readonly profit: ProfitResult;

  readonly trust: TrustValidation;

  constructor(data: {
    card: DivinationCard;
    market: MarketSnapshot;
    profit: ProfitResult;
    trust: TrustValidation;
  }) {
    this.card = data.card;
    this.market = data.market;
    this.profit = data.profit;
    this.trust = data.trust;
  }

  /**
   * Factory method: Create card arbitrage aggregate
   */
  static create(
    card: DivinationCard,
    market: MarketSnapshot,
    profit: ProfitResult,
    trust: TrustValidation,
  ): CardArbitrage {
    return new CardArbitrage({
      card, market, profit, trust,
    });
  }

  /**
   * Check if this arbitrage opportunity is actionable
   * (trusted and profitable - meets both domain constraints)
   */
  isActionable(): boolean {
    return this.trust.isValid && this.profit.isViable();
  }
}
