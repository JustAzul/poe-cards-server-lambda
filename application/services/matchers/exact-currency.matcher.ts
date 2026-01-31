import { ICardMatcher } from '@application/interfaces/services.interface';
import { ItemOverview } from '@domain/entities/item-overview.entity';
import { CurrencyItem } from '@domain/entities/currency-item.entity';
import { CardDetailsDto } from '@application/dtos/flip-table.dto';

export class ExactCurrencyMatcher implements ICardMatcher {
  private static readonly DIVINATION_CARD_CLASS = 6;

  // eslint-disable-next-line class-methods-use-this
  matchCard(
    leagueData: Array<ItemOverview | CurrencyItem>,
    cardName: string,
  ): ItemOverview | null {
    const cardOverview = leagueData.find(
      (item): item is ItemOverview => 'itemClass' in item
        && item.name === cardName
        && item.itemClass === ExactCurrencyMatcher.DIVINATION_CARD_CLASS,
    );
    return cardOverview || null;
  }

  // eslint-disable-next-line class-methods-use-this
  matchReward(
    leagueData: Array<ItemOverview | CurrencyItem>,
    cardDetails: CardDetailsDto,
  ): CurrencyItem | null {
    const currency = leagueData.find(
      (item): item is CurrencyItem => 'currencyTypeName' in item && item.currencyTypeName === cardDetails.Reward,
    );
    return currency || null;
  }
}
