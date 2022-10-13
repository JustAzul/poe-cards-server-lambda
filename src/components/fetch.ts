import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';

import { CurrencyOverviewResponse } from '../types/currency-overview-response.type';
import { ItemOverviewDictionary } from '../types/item-overview-dictionary.type';
import { ItemOverviewResponse } from '../types/item-overview-response.type';
import { ItemOverviewType } from '../types/item-overview-types.type';
import LEAGUE_OVERVIEW_FETCH_LIST from '../constants/fetch-list';
import { LeagueItemsOverview } from '../types/league-items-overview.type';
import { LeagueName } from '../types/league-name.type';
import { LeagueResponse } from '../types/league-response.type';
import userAgent from '../constants/user-agent';
import utils from './fetch.utils';

export default class Fetch {
  static utils = utils;

  private static async get<T>(
    url: string,
    config?: AxiosRequestConfig<never>,
  ): Promise<AxiosResponse<T, never>> {
    const result = await axios.get<T, AxiosResponse<T, never>, never>(url, {
      headers: {
        'user-agent': userAgent,
      },
      ...config,
    });

    return result;
  }

  static async leaguesData(): Promise<LeagueResponse[]> {
    console.log('Fetching leagues data from poe.ninja');

    const { data } = await this.get<LeagueResponse[]>(
      'https://api.pathofexile.com/leagues',
      {
        responseType: 'json',
      },
    );

    return this.utils.filterLeagues(data);
  }

  static async itemOverview<T extends ItemOverviewType>(
    leagueName: LeagueName,
    overviewType: T,
  ): Promise<Array<ItemOverviewDictionary[T]>> {
    console.log(`[${leagueName}] Fetching '${overviewType}' item overview`);

    const params = {
      language: 'en',
      league: leagueName,
      type: overviewType,
    };

    const { data } = await this.get<
      ItemOverviewResponse<ItemOverviewDictionary[T]>
    >('https://poe.ninja/api/data/itemoverview', {
      responseType: 'json',
      params,
    });

    return data.lines;
  }

  static async currencyOverview(leagueName: LeagueName) {
    console.log(`[${leagueName}] Fetching currency overview`);

    const params = {
      league: leagueName,
      type: 'Currency',
    };

    const { data } = await this.get<CurrencyOverviewResponse>(
      'https://poe.ninja/api/data/currencyoverview',
      {
        responseType: 'json',
        params,
      },
    );

    return {
      data: data.lines,
      details: data.currencyDetails,
    };
  }

  static async leagueItemsOverview(
    leagueName: LeagueName,
  ): Promise<LeagueItemsOverview> {
    const overviewsByName: LeagueItemsOverview = new Map(
      LEAGUE_OVERVIEW_FETCH_LIST.map(
        <T extends ItemOverviewType>(itemOverviewType: T) => [
          itemOverviewType,
          [] as Array<ItemOverviewDictionary[T]>,
        ],
      ),
    );

    for (let i = 0; i < LEAGUE_OVERVIEW_FETCH_LIST.length; i += 1) {
      const itemOverviewType = LEAGUE_OVERVIEW_FETCH_LIST[i];

      // eslint-disable-next-line no-await-in-loop
      const overview = await this.itemOverview(leagueName, itemOverviewType);

      overviewsByName.set(itemOverviewType, overview);
    }

    return overviewsByName;
  }

  static async leagueOverview(leagueName: LeagueName) {
    const currencyOverview = await this.currencyOverview(leagueName);
    const itemsOverview = await this.leagueItemsOverview(leagueName);

    return {
      currencyOverview,
      itemsOverview,
    };
  }
}
