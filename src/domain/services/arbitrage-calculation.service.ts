import { DivinationCard } from '@domain/entities/card.entity';
import { MarketSnapshot } from '@domain/value-objects/market-snapshot';
import { ProfitResult } from '@domain/value-objects/profit-result';
import { CurrencyItem } from '@domain/value-objects/currency-item';
import { ItemOverview } from '@domain/value-objects/item-overview';
import { CurrencyRewardSpec } from '@domain/value-objects/reward-spec';
/**
 * Arbitrage Calculation Domain Service
 * Encapsulates profit calculation business rules
 * Computes profitability metrics for arbitrage opportunities
 */
export class ArbitrageCalculationService {
  /**
   * Calculate profit for a card arbitrage opportunity
   * Computes profit value, set cost, reward value, and ROI
   */
  calculateProfit(card: DivinationCard, market: MarketSnapshot): ProfitResult | null {
    if (market.cardPrice.stackSize == null) return null;

    const rewardChaosValue = this.calculateRewardValue(card, market.rewardPrice);
    const { stackSize } = market.cardPrice;
    const cardSetCost = market.cardPrice.chaosValue * stackSize;
    const profit = rewardChaosValue - cardSetCost;
    const roi = cardSetCost > 0 ? (profit / cardSetCost) * 100 : 0;

    return new ProfitResult({
      chaosProfitValue: profit,
      setChaosPrice: cardSetCost,
      rewardChaosValue,
      roi,
    });
  }

  /**
   * Calculate reward value in chaos orbs
   * Handles both currency rewards (with amounts) and item rewards
   */
  private calculateRewardValue(
    card: DivinationCard,
    rewardPrice: ItemOverview | CurrencyItem,
  ): number {
    // Currency reward: calculate value with amount multiplier
    // invariant: rewardPrice is CurrencyItem only when card.isCurrencyCard()
    // — guaranteed by RewardMatcherService
    if (rewardPrice instanceof CurrencyItem) {
      return rewardPrice.chaosEquivalent * (card.rewardSpec as CurrencyRewardSpec).amount;
    }

    return rewardPrice.chaosValue;
  }
}
