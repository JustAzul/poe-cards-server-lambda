import { ICardMatcher } from '@application/interfaces/services.interface';
import { ItemOverview } from '@domain/entities/item-overview.entity';
import { CurrencyItem } from '@domain/entities/currency-item.entity';
import { Card, isItemCard, isCurrencyCard } from '@domain/entities/card.entity';

export class CardMatcher implements ICardMatcher {
  private static readonly DIVINATION_CARD_CLASS = 6;

  matchCard(
    items: ItemOverview[],
    cardName: string,
  ): ItemOverview | null {
    const cardOverview = items.find(
      (item) => item.name === cardName
        && item.itemClass === CardMatcher.DIVINATION_CARD_CLASS,
    );
    return cardOverview || null;
  }

  matchReward(
    items: ItemOverview[],
    currency: CurrencyItem[],
    cardDetails: Card,
  ): ItemOverview | CurrencyItem | null {
    if (isItemCard(cardDetails)) {
      return this.matchItemReward(items, cardDetails);
    }

    if (isCurrencyCard(cardDetails)) {
      return this.matchCurrencyReward(currency, cardDetails);
    }

    return null;
  }

  private matchItemReward(
    items: ItemOverview[],
    cardDetails: Card & { type: 'item' },
  ): ItemOverview | null {
    const matches = items.filter(
      (item) => item.name === cardDetails.reward
        && item.itemClass === cardDetails.rewardSpec.iClass
        && (item.corrupted ?? false) === cardDetails.rewardSpec.corrupted
        && (item.links ?? 0) === cardDetails.rewardSpec.links
        && (item.gemLevel ?? 0) === cardDetails.rewardSpec.gemLevel,
    );

    return matches.length === 1 ? matches[0] : null;
  }

  private matchCurrencyReward(
    currency: CurrencyItem[],
    cardDetails: Card & { type: 'currency' },
  ): CurrencyItem | null {
    const match = currency.find(
      (item) => item.currencyTypeName === cardDetails.reward,
    );
    return match || null;
  }
}
