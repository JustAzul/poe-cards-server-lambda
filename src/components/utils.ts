import { CardItem } from '../types/card-item.type';
import { ItemOverview } from '../types/item-overview.type';
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
    itemToFind: CardItem,
  ): T {
    let results = [...listToSearch];

    const itemKeys = Object.keys(itemToFind);
    for (let i = 0; i < itemKeys.length; i += 1) {
      const itemKey = itemKeys[i] as keyof CardItem;
      const keyValue = itemToFind[itemKey];

      if (itemKey === 'Reward') {
        results = results.filter(
          ({ name }) =>
            name.toLowerCase() === (keyValue as string).toLowerCase(),
        );
      }

      if (itemKey === 'Corrupted') {
        results = results.filter(
          // @ts-expect-error we have a default value that will handle the error case
          ({ corrupted = false }) => corrupted === keyValue,
        );
      }

      if (itemKey === 'iClass') {
        results = results.filter(({ itemClass }) => itemClass === keyValue);
      }

      if (itemKey === 'Links' && keyValue !== 0) {
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
        `Failed to find item ${itemToFind.Reward} with to many results found`,
      );
    }

    if (results.length === 0) {
      throw new Error(
        `Failed to find item ${itemToFind.Reward} with to zero results found`,
      );
    }

    // @ts-expect-error we will always have a result here
    return results.pop();
  }

  static findItemFromLeagueOverview(
    leagueOverview: LeagueItemsOverview,
    itemToFind: CardItem,
  ) {
    let result = null;

    leagueOverview.forEach((itemsOverview) => {
      try {
        result = this.findItem(itemsOverview, itemToFind);
        // eslint-disable-next-line no-empty
      } catch {}
    });

    return result;
  }
}
