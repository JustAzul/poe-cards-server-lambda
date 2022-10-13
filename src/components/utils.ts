import { CardItem } from '../types/card-item.type';
import { CurrencyOverview } from '../types/currency-overview.type';
import { FindItemInput } from '../types/find-item.input';
import { ItemClassDictionary } from '../types/item-class-dictionary.type';
import { ItemOverview } from '../types/item-overview.type';
import { ItemOverviewDictionary } from '../types/item-overview-dictionary.type';
import { ItemOverviewType } from '../types/item-overview-types.type';
import { ItemsOverviewType } from '../types/items-overview-type.type';
import { LeagueItemsOverview } from '../types/league-items-overview.type';
import { LeagueName } from '../types/league-name.type';
import { LeagueResponse } from '../types/league-response.type';
import { LeaguesDocument } from '../types/leagues-document.types';

export default class Utils {
  static findLeagueResponseByName(
    leagueResponses: LeagueResponse[],
  ): Map<LeagueName, LeagueResponse> {
    const leaguesWithDetails: Map<LeagueName, LeagueResponse> = new Map();

    for (let i = 0; i < leagueResponses.length; i += 1) {
      const leagueResponse = leagueResponses[i];
      leaguesWithDetails.set(leagueResponse.id, leagueResponse);
    }

    return leaguesWithDetails;
  }

  static parseLeagueDetails(
    leaguesByName: Map<LeagueName, LeagueResponse>,
  ): LeaguesDocument {
    return Object.fromEntries(
      Array.from(leaguesByName.values()).map(({ id: leagueName, url }) => [
        leagueName,
        {
          leagueName,
          ladder: url,
        },
      ]),
    );
  }

  static findItem<T extends ItemOverview>(
    listToSearch: Array<T>,
    itemToFind: FindItemInput,
  ): T {
    let results = [...listToSearch];

    const itemKeys = Object.keys(itemToFind);
    for (let i = 0; i < itemKeys.length; i += 1) {
      const itemKey = itemKeys[i] as keyof FindItemInput;
      const keyValue = itemToFind[itemKey];

      if (itemKey === 'name') {
        results = results.filter(
          ({ name }) =>
            name.toLowerCase() === (keyValue as string).toLowerCase(),
        );
      }

      if (itemKey === 'isCorrupted') {
        results = results.filter(
          // @ts-expect-error we have a default value that will handle the error case
          ({ corrupted = false }) => corrupted === keyValue,
        );
      }

      if (itemKey === 'itemClass') {
        results = results.filter(({ itemClass }) => itemClass === keyValue);
      }

      if (itemKey === 'links' && keyValue !== 0) {
        results = results.filter(
          // @ts-expect-error we have a default value that will handle the error case
          ({ links = 0 }) => links === keyValue,
        );
      }

      if (itemKey === 'gemLevel' && keyValue !== 0) {
        results = results.filter(
          // @ts-expect-error we have a default value that will handle the error case
          ({ gemLevel = 0 }) => gemLevel === keyValue,
        );
      }

      if (results.length === 1) break;
    }

    if (results.length >= 2) {
      throw new Error(
        `Failed to find item ${itemToFind.name} with to many results found`,
      );
    }

    if (results.length === 0) {
      throw new Error(
        `Failed to find item ${itemToFind.name} with to zero results found`,
      );
    }

    // @ts-expect-error we will always have a result here
    return results.pop();
  }

  static findItemFromLeagueOverview(
    leagueOverview: LeagueItemsOverview,
    itemToFind: FindItemInput,
  ): ItemOverviewDictionary[ItemOverviewType] | null {
    const keys = [...leagueOverview.keys()];

    for (let i = 0; i < keys.length; i += 1) {
      const itemsOverview = leagueOverview.get(keys[i]) as ItemsOverviewType;

      try {
        const result = this.findItem(itemsOverview, itemToFind);

        if (result) return result;
        // eslint-disable-next-line no-empty
      } catch {}
    }

    return null;
  }

  static findCardOverview(
    leagueOverview: LeagueItemsOverview,
    cardItem: CardItem,
  ) {
    return {
      cardOverview: this.findItemFromLeagueOverview(leagueOverview, {
        itemClass: ItemClassDictionary.DIVINATION_CARD,
        name: cardItem.Name,
      }),
      rewardOverview: this.findItemFromLeagueOverview(leagueOverview, {
        gemLevel: cardItem.gemLevel,
        isCorrupted: cardItem.Corrupted,
        itemClass: cardItem.iClass,
        links: cardItem.Links,
        name: cardItem.Reward,
      }),
    };
  }

  static findCurrencyChaosValue(
    CurrencyOverviewList: CurrencyOverview[],
    currencyName: string,
  ) {
    if (currencyName === 'Chaos Orb') return 1;

    const result = CurrencyOverviewList.find(
      ({ currencyTypeName }) => currencyName === currencyTypeName,
    );

    if (result) {
      return result.chaosEquivalent;
    }

    throw new Error('currency chaos value not found');
  }

  static transformChaosIntoExalted(exaltedValue: number, chaosValue: number) {
    return parseFloat((chaosValue / exaltedValue).toFixed(1));
  }
}
