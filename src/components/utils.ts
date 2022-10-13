import { CardCurrencyItem } from '../types/card-currency-item.type';
import { CardItem } from '../types/card-item.type';
import { CurrencyOverview } from '../types/currency-overview.type';
import { FindItemInput } from '../types/find-item.input';
import { ItemClassDictionary } from '../types/item-class-dictionary.type';
import { ItemOverviewDictionary } from '../types/item-overview-dictionary.type';
import { ItemOverviewType } from '../types/item-overview-types.type';
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

  private static filterFrom<T, KeyValueType>(
    itemOverview: T,
    key: string,
    keyValue: KeyValueType,
    defaultValue: KeyValueType,
  ): boolean {
    if (key in itemOverview) {
      return itemOverview[key as keyof T] === keyValue;
    }

    return keyValue === defaultValue;
  }

  static findItem<T extends ItemOverviewDictionary[ItemOverviewType]>(
    listToSearch: Array<T>,
    itemToFind: FindItemInput,
  ): T {
    let results = [...listToSearch];

    const itemKeys = Object.keys(itemToFind) as Array<keyof FindItemInput>;
    for (let i = 0; i < itemKeys.length; i += 1) {
      const itemKey = itemKeys[i];
      const keyValue = itemToFind[itemKey];

      if (itemKey === 'name') {
        results = results.filter(
          ({ name }) =>
            name.toLowerCase() === (keyValue as string).toLowerCase(),
        );
      }

      if (itemKey === 'itemClass') {
        results = results.filter(({ itemClass }) => itemClass === keyValue);
      }

      if (itemKey === 'isCorrupted') {
        results = results.filter((itemOverview) =>
          this.filterFrom(
            itemOverview,
            'corrupted',
            keyValue as boolean,
            false,
          ),
        );
      }

      if (itemKey === 'links' || itemKey === 'gemLevel') {
        results = results.filter((itemOverview) =>
          this.filterFrom(itemOverview, itemKey, keyValue as number, 0),
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
    leagueName?: LeagueName,
  ): ItemOverviewDictionary[ItemOverviewType] | null {
    const keys = [...leagueOverview.keys()];
    let result = null;

    // console.debug(`Searching for item ${itemToFind.name}..`);

    for (let i = 0; i < keys.length; i += 1) {
      const key = keys[i];
      const itemsOverview = leagueOverview.get(key);

      if (itemsOverview) {
        try {
          result = this.findItem(itemsOverview, itemToFind);

          if (result) {
            const logs = [];

            if (leagueName) {
              logs.push(`[${leagueName}]`);
            }

            logs.push(`Item '${itemToFind.name}' found in ${key}.`);

            console.debug(...logs);
            break;
          }
          // eslint-disable-next-line no-empty
        } catch {}
      }
    }

    return result;
  }

  static findCardOverview(
    leagueOverview: LeagueItemsOverview,
    cardItem: CardItem | CardCurrencyItem,
    leagueName?: LeagueName,
  ) {
    const cardOverview = this.findItemFromLeagueOverview(
      leagueOverview,
      {
        itemClass: ItemClassDictionary.DIVINATION_CARD,
        name: cardItem.Name,
      },
      leagueName,
    );

    if (!cardOverview) {
      throw new Error(`Failed to find card '${cardItem.Name}' overview`);
    }

    if ('Amount' in cardItem) {
      // TODO: find currency overview
      throw new Error('CardCurrencyItem not yet implemented.');
    }

    const searchOptions: FindItemInput = {
      name: cardItem.Reward,
    };

    if ('iClass' in cardItem) {
      searchOptions.itemClass = cardItem.iClass;
    }

    if ('Links' in cardItem) {
      searchOptions.links = cardItem.Links;
    }

    if ('gemLevel' in cardItem) {
      searchOptions.gemLevel = cardItem.gemLevel;
    }

    if ('Corrupted' in cardItem) {
      searchOptions.isCorrupted = cardItem.Corrupted;
    }

    const rewardOverview = this.findItemFromLeagueOverview(
      leagueOverview,
      searchOptions,
      leagueName,
    );

    if (!rewardOverview) {
      throw new Error(`Failed to find card '${cardItem.Name}' reward overview`);
    }

    return {
      cardOverview,
      rewardOverview,
    };
  }

  static findCurrencyChaosValue(
    CurrencyOverviewList: CurrencyOverview[],
    currencyName: string,
  ): number {
    if (currencyName === 'Chaos Orb') return 1;

    const result = CurrencyOverviewList.find(
      ({ currencyTypeName }) => currencyName === currencyTypeName,
    );

    if (result) {
      return result.chaosEquivalent;
    }

    throw new Error('Currency chaos value not found');
  }

  static transformChaosIntoExalted(exaltedValue: number, chaosValue: number) {
    return parseFloat((chaosValue / exaltedValue).toFixed(1));
  }
}
