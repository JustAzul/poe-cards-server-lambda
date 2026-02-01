import { Arbitrage } from '@domain/models/arbitrage';
import { ItemOverview } from './item-overview.entity';
import { CurrencyItem } from './currency-item.entity';
import { Card } from './card.base.entity';

/**
 * Item card - rewards items from league data
 * Includes specifications for matching items by class, corruption, links, and gem level
 */
export class ItemCard extends Card {
  constructor(
    name: string,
    reward: string,
    readonly rewardSpec: {
      iClass: number;
      corrupted: boolean;
      links: number;
      gemLevel: number;
    },
  ) {
    super(name, reward);
  }

  /**
   * Create ItemCard from raw config data
   */
  static fromConfig(raw: {
    Name: string;
    Reward: string;
    Corrupted: boolean;
    iClass: number;
    Links: number;
    gemLevel: number;
  }): ItemCard {
    return new ItemCard(raw.Name, raw.Reward, {
      iClass: raw.iClass,
      corrupted: raw.Corrupted,
      links: raw.Links,
      gemLevel: raw.gemLevel,
    });
  }

  validateTrust(
    cardOverview: ItemOverview,
    rewardOverview: ItemOverview | CurrencyItem,
    minTrustCount: number,
  ): boolean {
    const cardCount = cardOverview.count ?? 0;
    const rewardCount = (rewardOverview as ItemOverview).count ?? 0;

    return cardCount >= minTrustCount && rewardCount >= minTrustCount;
  }

  calculateProfit(
    cardOverview: ItemOverview,
    rewardOverview: ItemOverview | CurrencyItem,
  ): Arbitrage | null {
    const itemReward = rewardOverview as ItemOverview;
    const rewardChaosValue = itemReward.chaosValue;
    const stackSize = cardOverview.stackSize ?? 1;
    const { setChaosPrice, chaosProfit } = Card.calculateProfitMetrics(
      rewardChaosValue,
      stackSize,
      cardOverview.chaosValue,
    );

    const isGem = itemReward.itemClass === 4;
    const rewardText = isGem
      ? `Level ${itemReward.gemLevel ?? 0} ${itemReward.name}`
      : itemReward.name;

    return {
      cardName: cardOverview.name,
      cardStack: stackSize,
      cardChaosPrice: parseInt(String(cardOverview.chaosValue), 10),
      cardArtFilename: cardOverview.artFilename ?? '',
      cardFlavourText: cardOverview.flavourText ?? '',
      rewardName: rewardText,
      rewardChaosPrice: parseInt(String(rewardChaosValue), 10),
      rewardClass: itemReward.itemClass,
      isCorrupted: !!itemReward.corrupted,
      setChaosPrice,
      chaosProfit,
      isCurrency: false,
    };
  }

  matchReward(
    items: ItemOverview[],
  ): ItemOverview | null {
    const matches = items.filter(
      (item) => item.name === this.reward
        && item.itemClass === this.rewardSpec.iClass
        && (item.corrupted ?? false) === this.rewardSpec.corrupted
        && (item.links ?? 0) === this.rewardSpec.links
        && (item.gemLevel ?? 0) === this.rewardSpec.gemLevel,
    );

    return matches.length === 1 ? matches[0] : null;
  }
}
