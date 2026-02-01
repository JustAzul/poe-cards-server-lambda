import { ItemOverview } from '@domain/value-objects/item-overview';
import { CurrencyItem } from '@domain/value-objects/currency-item';

/**
 * Market Snapshot - Immutable pricing data for card and reward
 * Value object encapsulating market state at a specific point in time
 */
export class MarketSnapshot {
  readonly cardPrice: ItemOverview;

  readonly rewardPrice: ItemOverview | CurrencyItem;

  readonly leagueId: string;

  constructor(data: {
    cardPrice: ItemOverview;
    rewardPrice: ItemOverview | CurrencyItem;
    leagueId: string;
  }) {
    this.cardPrice = data.cardPrice;
    this.rewardPrice = data.rewardPrice;
    this.leagueId = data.leagueId;
  }

  /**
   * Factory method: Create MarketSnapshot from market data
   */
  static create(
    cardPrice: ItemOverview,
    rewardPrice: ItemOverview | CurrencyItem,
    leagueId: string,
  ): MarketSnapshot {
    return new MarketSnapshot({ cardPrice, rewardPrice, leagueId });
  }

  /**
   * Get reward value in chaos orbs
   */
  private getRewardChaosValue(): number {
    if (this.rewardPrice instanceof CurrencyItem) {
      return this.rewardPrice.chaosEquivalent;
    }
    return this.rewardPrice.chaosValue;
  }

  /**
   * Calculate raw profit margin (reward - card set cost)
   */
  calculateProfitMargin(): number {
    const stackSize = this.cardPrice.getStackSize();
    const cardSetCost = this.cardPrice.chaosValue * stackSize;
    const rewardValue = this.getRewardChaosValue();

    return rewardValue - cardSetCost;
  }

  /**
   * Get card set total cost in chaos orbs
   */
  getCardSetCost(): number {
    return this.cardPrice.getTotalStackCost();
  }

  /**
   * Calculate return on investment percentage
   */
  calculateROI(): number {
    const cardSetCost = this.getCardSetCost();

    if (cardSetCost === 0) return 0;

    return (this.calculateProfitMargin() / cardSetCost) * 100;
  }

  /**
   * Get total reward value in chaos
   */
  getRewardValue(): number {
    return this.getRewardChaosValue();
  }

  /**
   * Convert to plain object for serialization
   */
  toPlain(): Record<string, unknown> {
    return {
      cardPrice: this.serializePrice(this.cardPrice),
      rewardPrice: this.serializePrice(this.rewardPrice),
      leagueId: this.leagueId,
    };
  }

  /**
   * Helper method to serialize price objects
   */
  private serializePrice(price: ItemOverview | CurrencyItem): Record<string, unknown> {
    if (price instanceof ItemOverview) {
      return price.toPlain();
    }
    if (price instanceof CurrencyItem) {
      return price.toPlain();
    }
    return price;
  }
}
