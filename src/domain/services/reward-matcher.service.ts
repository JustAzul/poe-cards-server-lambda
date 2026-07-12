import { DivinationCard } from '@domain/entities/card.entity';
import { ItemOverview } from '@domain/value-objects/item-overview';
import { CurrencyItem } from '@domain/value-objects/currency-item';
import { RewardType } from '@domain/value-objects/reward-spec';
import { ItemClass } from '@domain/value-objects/item-class.enum';
import { Logger } from '@shared/logger';

/**
 * Reward Matcher Domain Service
 * Encapsulates business logic for matching card rewards to market data
 * Handles both currency and item reward matching strategies
 */

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

  /**
   * Base types that can never exist at 0 links (verified via poedb.tw/poewiki.net).
   * For these, the lowest listed tier is the lowest possible tier. Any other unique
   * with no 0-link listing gets null instead — a missing 0-link listing there means
   * "not currently for sale unlinked," not "impossible," and using a linked price
   * would overstate the card's actual (unlinked) reward value.
   */
  private static readonly INTRINSICALLY_LINKED_UNIQUES = new Set([
    'Tabula Rasa',
    'Skin of the Loyal',
    'Skin of the Lords',
    'The Goddess Unleashed',
    'Oni-Goroshi',
    'Shadowstitch',
  ]);

  constructor(private readonly logger: Logger) {}

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

    if (!currencyByName.has(CurrencyItem.BASELINE_CURRENCY)) {
      // Synthetic baseline used only when the currency feed lacks Chaos Orb; its
      // liquidity is irrelevant since Chaos Orb short-circuits trust validation.
      currencyByName.set(CurrencyItem.BASELINE_CURRENCY, new CurrencyItem({
        currencyTypeName: CurrencyItem.BASELINE_CURRENCY,
        chaosEquivalent: 1,
      }));
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
   * Match item reward by name and specifications
   *
   * Gem matching: strict on itemClass, corruption, gemLevel — gems have no
   * link count in-game, so links is not part of the match.
   * Non-gem matching: relaxed on itemClass (accept relic variants) and
   * ignores corruption — poe.ninja never lists the same unique at both
   * corrupted and non-corrupted, so there's no tier to disambiguate. Link
   * tier DOES vary per listing for uniques, so when a name resolves to
   * several link-tier candidates, delegate to matchLowestLinkTier.
   */
  private matchItem(
    index: MarketIndex,
    card: DivinationCard,
  ): ItemOverview | null {
    if (card.rewardSpec.type !== RewardType.ITEM) return null;
    const { rewardSpec } = card;

    const candidates = index.itemsByName.get(card.reward);
    if (!candidates) return null;

    const isGem = rewardSpec.itemClass === ItemClass.SKILL_GEM;

    const matches = candidates.filter((item) => {
      if (isGem) {
        return item.itemClass === rewardSpec.itemClass
          && (item.corrupted ?? false) === rewardSpec.corrupted
          && (item.gemLevel ?? 0) === rewardSpec.gemLevel;
      }
      return item.itemClass === rewardSpec.itemClass
        || item.itemClass === ItemClass.RELIC;
    });

    if (matches.length === 0) return null;

    if (!isGem) {
      return this.matchLinkTier(card, matches);
    }

    return matches.length === 1
      ? matches[0]
      : RewardMatcherService.pickHighestCount(this.logger, card, matches);
  }

  /**
   * Divination cards grant the base (0-link) variant of an ordinary unique.
   * A handful of base types can never exist at 0 links (INTRINSICALLY_LINKED_UNIQUES);
   * for those, the lowest listed tier is the correct match. For everything else, a
   * missing 0-link listing means "not for sale unlinked right now," not "impossible" —
   * matching a linked listing there would overstate the reward's real value, so return
   * null instead of guessing.
   */
  private matchLinkTier(card: DivinationCard, matches: ItemOverview[]): ItemOverview | null {
    if (!RewardMatcherService.INTRINSICALLY_LINKED_UNIQUES.has(card.reward)) {
      const zeroLinkMatches = matches.filter((item) => (item.links ?? 0) === 0);

      if (zeroLinkMatches.length === 0) {
        this.logger.warn(
          `[RewardMatcher] Card "${card.name}" reward "${card.reward}" has no 0-link `
          + `listing among ${matches.length} candidate(s); skipping (not an `
          + 'intrinsically-linked base type)',
        );
        return null;
      }

      if (zeroLinkMatches.length < matches.length) {
        this.logger.warn(
          `[RewardMatcher] Card "${card.name}" reward "${card.reward}" had `
          + `${matches.length} link-tier variants; selected the 0-link variant`,
        );
      }

      return zeroLinkMatches.length === 1
        ? zeroLinkMatches[0]
        : RewardMatcherService.pickHighestCount(this.logger, card, zeroLinkMatches);
    }

    const minLinks = Math.min(...matches.map((item) => item.links ?? 0));
    const lowestTierMatches = matches.filter((item) => (item.links ?? 0) === minLinks);

    if (lowestTierMatches.length < matches.length) {
      this.logger.warn(
        `[RewardMatcher] Card "${card.name}" reward "${card.reward}" had `
        + `${matches.length} link-tier variants; selected the ${minLinks}-link variant `
        + '(intrinsically-linked base type)',
      );
    }

    return lowestTierMatches.length === 1
      ? lowestTierMatches[0]
      : RewardMatcherService.pickHighestCount(this.logger, card, lowestTierMatches);
  }

  /**
   * Tie-break an ambiguous set of candidates by listing count, then chaosValue
   */
  private static pickHighestCount(
    logger: Logger,
    card: DivinationCard,
    matches: ItemOverview[],
  ): ItemOverview {
    logger.warn(
      `[RewardMatcher] Ambiguous match: card "${card.name}" reward "${card.reward}" `
      + `matched ${matches.length} items, using highest-count entry`,
    );
    matches.sort((a, b) => (b.count ?? 0) - (a.count ?? 0)
      || b.chaosValue - a.chaosValue);
    return matches[0];
  }
}
