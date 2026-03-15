import { DivinationCard } from '@domain/entities/card.entity';
import { ItemOverview } from '@domain/value-objects/item-overview';
import { CurrencyItem } from '@domain/value-objects/currency-item';
import { RewardType } from '@domain/value-objects/reward-spec';
import { ItemClass } from '@domain/value-objects/item-class.enum';

/**
 * Reward Matcher Domain Service
 * Encapsulates business logic for matching card rewards to market data
 * Handles both currency and item reward matching strategies
 */
export type AmbiguousMatchCallback = (
  cardName: string,
  rewardName: string,
  matchCount: number,
) => void;

/**
 * Pre-built index for O(1) market data lookups
 * Built once per league, used for all card evaluations
 */
export interface MarketIndex {
  cardsByName: Map<string, ItemOverview>;
  itemsByName: Map<string, ItemOverview[]>;
  currencyByName: Map<string, CurrencyItem>;
}

export class RewardMatcherService {
  private static readonly DIVINATION_CARD_CLASS = ItemClass.DIVINATION_CARD;

  private readonly onAmbiguousMatch?: AmbiguousMatchCallback;

  constructor(onAmbiguousMatch?: AmbiguousMatchCallback) {
    this.onAmbiguousMatch = onAmbiguousMatch;
  }

  /**
   * Build a market index for O(1) lookups during batch evaluation
   */
  buildIndex(items: ItemOverview[], currency: CurrencyItem[]): MarketIndex {
    const cardsByName = new Map<string, ItemOverview>();
    const itemsByName = new Map<string, ItemOverview[]>();

    for (const item of items) {
      if (item.itemClass === RewardMatcherService.DIVINATION_CARD_CLASS) {
        cardsByName.set(item.name, item);
      }

      const existing = itemsByName.get(item.name);
      if (existing) {
        existing.push(item);
      } else {
        itemsByName.set(item.name, [item]);
      }
    }

    const currencyByName = new Map<string, CurrencyItem>();
    for (const c of currency) {
      currencyByName.set(c.currencyTypeName, c);
    }

    return { cardsByName, itemsByName, currencyByName };
  }

  /**
   * Find card price in market index by name
   */
  findCardPrice(index: MarketIndex, cardName: string): ItemOverview | null {
    return index.cardsByName.get(cardName) ?? null;
  }

  /**
   * Find reward price based on card specifications
   * Routes to currency matching or item matching based on card type
   */
  findRewardPrice(
    index: MarketIndex,
    card: DivinationCard,
  ): ItemOverview | CurrencyItem | null {
    if (card.isCurrencyCard()) {
      return index.currencyByName.get(card.reward) ?? null;
    }

    return this.matchItem(index, card);
  }

  /**
   * Match item reward by name and specifications (itemClass, corruption, links, gem level)
   * Returns matching item if exactly one match found, null otherwise
   */
  private matchItem(index: MarketIndex, card: DivinationCard): ItemOverview | null {
    if (card.rewardSpec.type !== RewardType.ITEM) return null;
    const { rewardSpec } = card;

    const candidates = index.itemsByName.get(card.reward);
    if (!candidates) return null;

    const matches = candidates.filter(
      (item) => item.itemClass === rewardSpec.itemClass
        && (item.corrupted ?? false) === rewardSpec.corrupted
        && (item.links ?? 0) === rewardSpec.links
        && (item.gemLevel ?? 0) === rewardSpec.gemLevel,
    );

    if (matches.length > 1) {
      this.onAmbiguousMatch?.(card.name, card.reward, matches.length);
    }

    return matches.length === 1 ? matches[0] : null;
  }
}
