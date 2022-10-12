import { CurrencyOverviewResponse } from '../types/currency-overview-response.type';
import { ItemOverviewDictionary } from '../types/item-overview-dictionary.type';
import { ItemOverviewResponse } from '../types/item-overview-response.type';
import { ItemOverviewType } from '../types/item-overview-types.type';
import { LeagueName } from '../types/league-name.type';
import { LeagueResponse } from '../types/league-response.type';
import axios from 'axios';
import userAgent from '../constants/user-agent';
import utils from './fetch.utils';

export default {
  async leaguesData(): Promise<LeagueResponse[]> {
    console.log('Fetching leagues data from poe.ninja');

    const { data } = await axios.get<LeagueResponse[]>('https://api.pathofexile.com/leagues', {
      responseType: 'json',
      headers: {
        'user-agent': userAgent,
      },
    });

    return utils.filterLeagues(data);
  },

  async itemOverview<OverviewType extends ItemOverviewType>(
    leagueName: LeagueName,
    overviewType: OverviewType,
  ): Promise< ItemOverviewDictionary[OverviewType][] > {
    console.log(`Fetching ${overviewType} item overview for ${leagueName}`);

    const params = {
      language: 'en',
      league: leagueName,
      type: overviewType,
    };

    const { data } = await axios.get<ItemOverviewResponse<ItemOverviewDictionary[OverviewType]>>('https://poe.ninja/api/data/itemoverview', {
      responseType: 'json',
      params,
      headers: {
        'user-agent': userAgent,
      },
    });

    return data.lines;
  },

  async currencyOverview(leagueName: LeagueName) {
    console.log(`Fetching currency overview for ${leagueName}`);

    const params = {
      league: leagueName,
      type: 'Currency',
    };

    const { data } = await axios.get<CurrencyOverviewResponse>('https://poe.ninja/api/data/currencyoverview', {
      responseType: 'json',
      params,
      headers: {
        'user-agent': userAgent,
      },
    });

    return {
      data: data.lines,
      details: data.currencyDetails,
    };
  },
  utils,
};
