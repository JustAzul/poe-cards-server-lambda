import { Arbitrage } from '@domain/models/arbitrage';
import { ItemOverview } from './item-overview.entity';
import { CurrencyItem } from './currency-item.entity';

/**
 * Abstract base class for divination cards
 * Encapsulates card behavior including trust validation, profit calculation, and reward matching
 */
export abstract class Card {
  constructor(
    readonly name: string,
    readonly reward: string,
  ) {}

  /**
   * Validate if this card meets the minimum trust requirements
   */
  abstract validateTrust(
    cardOverview: ItemOverview,
    rewardOverview: ItemOverview | CurrencyItem,
    minTrustCount: number,
  ): boolean;

  /**
   * Calculate profit for this card given league data
   */
  abstract calculateProfit(
    cardOverview: ItemOverview,
    rewardOverview: ItemOverview | CurrencyItem,
  ): Arbitrage | null;

  /**
   * Match reward from league data items or currency
   */
  abstract matchReward(
    items: ItemOverview[],
    currency: CurrencyItem[],
  ): ItemOverview | CurrencyItem | null;

  /**
   * Calculate profit metrics (set chaos price and profit)
   */
  protected static calculateProfitMetrics(
    rewardChaosValue: number,
    stackSize: number,
    cardChaosValue: number,
  ): { setChaosPrice: number; chaosProfit: number } {
    const cardSetChaosValue = stackSize * cardChaosValue;
    const chaosProfit = parseInt(String(rewardChaosValue - cardSetChaosValue), 10);

    return {
      setChaosPrice: parseInt(String(cardSetChaosValue), 10),
      chaosProfit,
    };
  }
}
