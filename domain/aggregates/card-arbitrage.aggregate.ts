import { DivinationCard } from '@domain/entities/card.entity';
import { MarketSnapshot } from '@domain/value-objects/market-snapshot';
import { ProfitResult } from '@domain/value-objects/profit-result';
import { TrustValidation } from '@domain/value-objects/trust-validation';
import { ItemOverview } from '@domain/value-objects/item-overview';
import { CurrencyRewardSpec, RewardType } from '@domain/value-objects/reward-spec';

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

  /**
   * Get formatted reward display name for presentation
   * Handles special formatting for multiple currency amounts and gem levels
   */
  getRewardDisplayName(): string {
    const { card, market } = this;

    // For currency cards, check if amount > 1
    if (card.rewardSpec.type === RewardType.CURRENCY) {
      const spec = card.rewardSpec as CurrencyRewardSpec;
      return spec.amount > 1
        ? `${spec.amount}x ${card.reward}`
        : card.reward;
    }

    // For items, check if it's a gem (itemClass 4)
    const { rewardPrice } = market;
    const isGem = 'itemClass' in rewardPrice && rewardPrice.itemClass === 4;

    if (isGem) {
      const itemPrice = rewardPrice as ItemOverview;
      return `Level ${itemPrice.gemLevel ?? 0} ${itemPrice.name}`;
    }

    return card.reward;
  }
}
