import { ItemClassDictionary } from '../types/item-class-dictionary.enum';

import type { CardCurrencyItem } from '../types/card-currency-item.type';
import type { CardItem } from '../types/card-item.type';
import type { CardOverview } from '../types/card-overview.type';
import type { CurrencyOverview } from '../types/currency-overview.type';
import type { FindItemInput } from '../types/find-item.input';
import type { ItemOverviewDictionary } from '../types/item-overview-dictionary.type';
import type { ItemOverviewType } from '../types/item-overview-types.type';
import type { LeagueItemsOverview } from '../types/league-items-overview.type';
import type { LeagueName } from '../types/league-name.type';
import type { LeagueOverview } from '../types/league-overview.type';
import type { LeagueResponse } from '../types/league-response.type';
import type { LeaguesDocument } from '../types/leagues-document.types';

export default class Utils {
  public static FindLeagueResponseByName(
    leagueResponses: LeagueResponse[],
  ): Map<LeagueName, LeagueResponse> {
    const leaguesWithDetails: Map<LeagueName, LeagueResponse> = new Map();

    for (let i = 0; i < leagueResponses.length; i += 1) {
      const leagueResponse = leagueResponses[i];
      leaguesWithDetails.set(leagueResponse.id, leagueResponse);
    }

    return leaguesWithDetails;
  }

  public static GetLeaguesDocument(
    leaguesResponseByName: Map<LeagueName, LeagueResponse>,
  ): LeaguesDocument {
    return Object.fromEntries(
      Array.from(leaguesResponseByName.values()).map(
        ({ id: leagueName, url }) => [
          leagueName,
          {
            leagueName,
            ladder: url,
          },
        ],
      ),
    );
  }

  private static FilterFrom<T, KeyValueType>(
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

  private static FindCurrency(
    currencyOverview: CurrencyOverview[],
    currencyName: string,
  ): Pick<CurrencyOverview, 'chaosEquivalent' | 'currencyTypeName'> | null {
    if (currencyName === 'Chaos Orb') {
      return {
        chaosEquivalent: 1,
        currencyTypeName: 'Chaos Orb',
      };
    }

    return (
      currencyOverview.find(
        ({ currencyTypeName }) => currencyTypeName === currencyName,
      ) || null
    );
  }

  private static FindItem<T extends ItemOverviewDictionary[ItemOverviewType]>(
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
          ({ name }) => name.toLowerCase() === String(keyValue).toLowerCase(),
        );
      }

      if (itemKey === 'itemClass') {
        results = results.filter(({ itemClass }) => itemClass === keyValue);
      }

      if (itemKey === 'isCorrupted') {
        results = results.filter((itemOverview) =>
          Utils.FilterFrom(itemOverview, 'corrupted', Boolean(keyValue), false),
        );
      }

      if (itemKey === 'links' || itemKey === 'gemLevel') {
        results = results.filter((itemOverview) =>
          Utils.FilterFrom(itemOverview, itemKey, Number(keyValue), 0),
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

  private static FindItemFromLeagueOverview(
    leagueOverview: LeagueItemsOverview,
    itemToFind: FindItemInput,
    leagueName?: LeagueName,
  ): ItemOverviewDictionary[ItemOverviewType] | null {
    const keys = [...leagueOverview.keys()];
    let result: ItemOverviewDictionary[ItemOverviewType] | null = null;

    // console.debug(`Searching for item ${itemToFind.name}..`);

    for (let i = 0; i < keys.length; i += 1) {
      const key = keys[i];
      const itemsOverview = leagueOverview.get(key);

      if (itemsOverview) {
        try {
          result = Utils.FindItem(itemsOverview, itemToFind);

          if (result) {
            const logs = [];

            if (leagueName) {
              logs.push(`[${leagueName}]`);
            }

            logs.push(`Item '${itemToFind.name}' found in '${key}'.`);

            // eslint-disable-next-line no-console
            console.debug(...logs);
            break;
          }
          // eslint-disable-next-line no-empty
        } catch {}
      }
    }

    return result;
  }

  public static FindCardOverview(
    { currencyOverview, itemsOverview }: LeagueOverview,
    cardItem: CardItem | CardCurrencyItem,
    leagueName?: LeagueName,
  ): CardOverview {
    const cardOverview = Utils.FindItemFromLeagueOverview(
      itemsOverview,
      {
        itemClass: ItemClassDictionary.DIVINATION_CARD,
        name: cardItem.cardName,
      },
      leagueName,
    );

    if (!cardOverview) {
      throw new Error(`Failed to find card '${cardItem.cardName}' overview`);
    }

    if ('amount' in cardItem) {
      return {
        cardOverview,
        rewardOverview: Utils.FindCurrency(
          currencyOverview.data,
          cardItem.rewardName,
        ),
      };
    }

    const searchOptions: FindItemInput = {
      name: cardItem.rewardName,
    };

    if ('itemClass' in cardItem) {
      searchOptions.itemClass = cardItem.itemClass;
    }

    if ('links' in cardItem) {
      searchOptions.links = cardItem.links;
    }

    if ('gemLevel' in cardItem) {
      searchOptions.gemLevel = cardItem.gemLevel;
    }

    if ('corrupted' in cardItem) {
      searchOptions.isCorrupted = cardItem.corrupted;
    }

    const rewardOverview = Utils.FindItemFromLeagueOverview(
      itemsOverview,
      searchOptions,
      leagueName,
    );

    if (!rewardOverview) {
      throw new Error(
        `Failed to find card '${cardItem.cardName}' reward overview`,
      );
    }

    return {
      cardOverview,
      rewardOverview,
    };
  }

  public static FindCurrencyChaosValue(
    currencyOverview: CurrencyOverview[],
    currencyName: string,
  ): number {
    if (currencyName === 'Chaos Orb') return 1;

    const { chaosEquivalent } =
      Utils.FindCurrency(currencyOverview, currencyName) || {};

    if (chaosEquivalent) {
      return chaosEquivalent;
    }

    throw new Error('Currency chaos value not found');
  }

  public static TransformChaosIntoExalted(
    exaltedValue: number,
    chaosValue: number,
  ) {
    return parseFloat((chaosValue / exaltedValue).toFixed(1));
  }
}
