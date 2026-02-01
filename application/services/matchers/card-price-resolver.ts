import { ICardPriceResolver } from '@application/interfaces/services.interface';
import { ItemOverview } from '@domain/entities/item-overview.entity';
import { CurrencyItem } from '@domain/entities/currency-item.entity';
import { Card } from '@domain/entities/card.base.entity';

export class CardPriceResolver implements ICardPriceResolver {
  private static readonly DIVINATION_CARD_CLASS = 6;

  findCardPrice(
    items: ItemOverview[],
    cardName: string,
  ): ItemOverview | null {
    const cardOverview = items.find(
      (item) => item.name === cardName
        && item.itemClass === CardPriceResolver.DIVINATION_CARD_CLASS,
    );
    return cardOverview || null;
  }

  findRewardPrice(
    items: ItemOverview[],
    currency: CurrencyItem[],
    cardDetails: Card,
  ): ItemOverview | CurrencyItem | null {
    return cardDetails.matchReward(items, currency);
  }
}
