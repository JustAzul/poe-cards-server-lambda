import { ItemOverview } from './item-overview.entity';
import { CurrencyItem } from './currency-item.entity';
import { Arbitrage } from '@domain/models/arbitrage';
import { Card } from './card.base.entity';

/**
 * Currency card - rewards currency from league data
 * Includes amount specification for stacking currency rewards
 */
export class CurrencyCard extends Card {
  constructor(
    name: string,
    reward: string,
    readonly rewardSpec: {
      amount: number;
    },
  ) {
    super(name, reward);
  }

  /**
   * Create CurrencyCard from raw config data
   */
  static fromConfig(raw: {
    Name: string;
    Reward: string;
    Amount: number;
  }): CurrencyCard {
    return new CurrencyCard(raw.Name, raw.Reward, {
      amount: raw.Amount,
    });
  }

  validateTrust(
    cardOverview: ItemOverview,
    rewardOverview: ItemOverview | CurrencyItem,
    minTrustCount: number,
  ): boolean {
    const cardCount = cardOverview.count ?? 0;
    if (cardCount < minTrustCount) return false;

    // Chaos Orb is baseline - always trusted
    if (this.reward === 'Chaos Orb') return true;

    const receiveCount = (rewardOverview as CurrencyItem).receive?.count ?? 0;
    return receiveCount >= minTrustCount;
  }

  calculateProfit(
    cardOverview: ItemOverview,
    rewardOverview: ItemOverview | CurrencyItem,
  ): Arbitrage | null {
    const currencyReward = rewardOverview as CurrencyItem;
    const rewardChaosEquivalent = this.reward === 'Chaos Orb'
      ? 1
      : currencyReward.chaosEquivalent;

    if (!rewardChaosEquivalent) return null;

    const rewardChaosValue = rewardChaosEquivalent * this.rewardSpec.amount;
    const stackSize = cardOverview.stackSize ?? 1;
    const { setChaosPrice, chaosProfit } = Card.calculateProfitMetrics(
      rewardChaosValue,
      stackSize,
      cardOverview.chaosValue,
    );

    const hasMultipleRewards = this.rewardSpec.amount > 1;
    const rewardText = hasMultipleRewards
      ? `${this.rewardSpec.amount}x ${this.reward}`
      : this.reward;

    return {
      cardName: this.name,
      cardStack: stackSize,
      cardChaosPrice: parseInt(String(cardOverview.chaosValue), 10),
      cardArtFilename: cardOverview.artFilename ?? '',
      cardFlavourText: cardOverview.flavourText ?? '',
      rewardName: rewardText,
      rewardChaosPrice: parseInt(String(rewardChaosValue), 10),
      rewardClass: '00',
      isCorrupted: false,
      setChaosPrice,
      chaosProfit,
      isCurrency: true,
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  matchReward(
    items: ItemOverview[],
    currency: CurrencyItem[],
  ): CurrencyItem | null {
    const match = currency.find(
      (item) => item.currencyTypeName === this.reward,
    );
    return match || null;
  }
}
