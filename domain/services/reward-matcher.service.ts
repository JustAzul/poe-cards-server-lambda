import { DivinationCard } from '@domain/entities/card.entity';
import { ItemOverview } from '@domain/value-objects/item-overview';
import { CurrencyItem } from '@domain/value-objects/currency-item';
import { ItemRewardSpec } from '@domain/value-objects/reward-spec';

/**
 * Reward Matcher Domain Service
 * Encapsulates business logic for matching card rewards to market data
 * Handles both currency and item reward matching strategies
 */
export class RewardMatcherService {
  private static readonly DIVINATION_CARD_CLASS = 6;

  /**
   * Find card price in market items by name and divination card class
   */
  findCardPrice(items: ItemOverview[], cardName: string): ItemOverview | null {
    return (
      items.find(
        (item) => item.name === cardName
          && item.itemClass === RewardMatcherService.DIVINATION_CARD_CLASS,
      ) ?? null
    );
  }

  /**
   * Find reward price based on card specifications
   * Routes to currency matching or item matching based on card type
   */
  findRewardPrice(
    items: ItemOverview[],
    currency: CurrencyItem[],
    card: DivinationCard,
  ): ItemOverview | CurrencyItem | null {
    if (card.isCurrencyCard()) {
      return this.matchCurrency(currency, card.reward);
    }

    return this.matchItem(items, card);
  }

  /**
   * Match currency reward by currency type name
   */
  private matchCurrency(currency: CurrencyItem[], rewardName: string): CurrencyItem | null {
    return currency.find((c) => c.currencyTypeName === rewardName) ?? null;
  }

  /**
   * Match item reward by name and specifications (itemClass, corruption, links, gem level)
   * Returns matching item if exactly one match found, null otherwise
   */
  private matchItem(items: ItemOverview[], card: DivinationCard): ItemOverview | null {
    const spec = card.rewardSpec as ItemRewardSpec;

    const matches = items.filter(
      (item) => item.name === card.reward
        && item.itemClass === spec.itemClass
        && (item.corrupted ?? false) === spec.corrupted
        && (item.links ?? 0) === spec.links
        && (item.gemLevel ?? 0) === spec.gemLevel,
    );

    return matches.length === 1 ? matches[0] : null;
  }
}
