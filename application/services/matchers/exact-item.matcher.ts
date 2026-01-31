import { ICardMatcher } from '@application/interfaces/services.interface';
import { ItemOverview } from '@domain/entities/item-overview.entity';
import { CurrencyItem } from '@domain/entities/currency-item.entity';
import { ItemCard } from '@domain/entities/card.entity';

export class ExactItemMatcher implements ICardMatcher {
  private static readonly DIVINATION_CARD_CLASS = 6;

  // eslint-disable-next-line class-methods-use-this
  matchCard(
    leagueData: Array<ItemOverview | CurrencyItem>,
    cardName: string,
  ): ItemOverview | null {
    const cardOverview = leagueData.find(
      (item): item is ItemOverview => 'itemClass' in item
        && item.name === cardName
        && item.itemClass === ExactItemMatcher.DIVINATION_CARD_CLASS,
    );
    return cardOverview || null;
  }

  // eslint-disable-next-line class-methods-use-this
  matchReward(
    leagueData: Array<ItemOverview | CurrencyItem>,
    cardDetails: ItemCard,
  ): ItemOverview | null {
    const items = leagueData.filter(
      (item): item is ItemOverview => 'itemClass' in item,
    );

    const matches = items
      .filter((item) => item.name === cardDetails.reward
        && item.itemClass === cardDetails.rewardSpec.iClass)
      .filter((item) => (item.corrupted ?? false) === cardDetails.rewardSpec.corrupted)
      .filter((item) => (item.links ?? 0) === cardDetails.rewardSpec.links)
      .filter((item) => (item.gemLevel ?? 0) === cardDetails.rewardSpec.gemLevel);

    return matches.length === 1 ? matches[0] : null;
  }
}
