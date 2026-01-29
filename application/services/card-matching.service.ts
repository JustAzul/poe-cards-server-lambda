import { ICardMatchingService } from '@application/interfaces/services.interface';
import { ItemOverview } from '@domain/entities/item-overview.entity';
import { CurrencyItem } from '@domain/entities/currency-item.entity';
import { CardDetailsDto } from '@application/dtos/flip-table.dto';
import { CardMatchResultDto } from '@application/dtos/card-match.dto';

export class CardMatchingService implements ICardMatchingService {
  /**
   * Find matching card and reward in league data
   */
  findCardMatch(
    leagueData: Array<ItemOverview | CurrencyItem>,
    cardDetails: CardDetailsDto,
    isCurrency: boolean
  ): CardMatchResultDto {
    // Find the divination card itself (itemClass 6 = Divination Card)
    const cardOverview = leagueData.find(
      (item): item is ItemOverview =>
        'itemClass' in item &&
        item.name === cardDetails.Name &&
        item.itemClass === 6
    ) || null;

    // Find the reward
    const rewardOverview = isCurrency
      ? this.findCurrencyReward(leagueData, cardDetails)
      : this.findItemReward(leagueData, cardDetails);

    const isValid = cardOverview !== null && rewardOverview !== null;

    return { cardOverview, rewardOverview, isValid };
  }

  private findCurrencyReward(
    leagueData: Array<ItemOverview | CurrencyItem>,
    cardDetails: CardDetailsDto
  ): CurrencyItem | null {
    const currency = leagueData.find(
      (item): item is CurrencyItem =>
        'currencyTypeName' in item && item.currencyTypeName === cardDetails.Reward
    );
    return currency || null;
  }

  private findItemReward(
    leagueData: Array<ItemOverview | CurrencyItem>,
    cardDetails: CardDetailsDto
  ): ItemOverview | null {
    const items = leagueData.filter((item): item is ItemOverview => 'itemClass' in item);

    const matches = items
      .filter(item => item.name === cardDetails.Reward && item.itemClass === (cardDetails.iClass ?? 0))
      .filter(item => (item.corrupted ?? false) === (cardDetails.Corrupted ?? false))
      .filter(item => (item.links ?? 0) === (cardDetails.Links ?? 0))
      .filter(item => (item.gemLevel ?? 0) === (cardDetails.gemLevel ?? 0));

    return matches.length === 1 ? matches[0] : null;
  }
}

export const cardMatchingService = new CardMatchingService();
