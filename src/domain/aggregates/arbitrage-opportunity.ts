import { DivinationCard } from '@domain/entities/card.entity';
import { MarketSnapshot } from '@domain/value-objects/market-snapshot';
import { ProfitResult } from '@domain/value-objects/profit-result';
import { TrustValidation } from '@domain/value-objects/trust-validation';

/**
 * Composite result of arbitrage evaluation
 *
 * Note: Despite its location in /aggregates/, this is a read-only composite
 * result rather than a DDD aggregate root. It holds the card, market snapshot,
 * profit calculation, and trust validation together as a single evaluation result.
 */
export class ArbitrageOpportunity {
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

  isActionable(): boolean {
    return this.trust.isValid && this.profit.isViable();
  }
}
