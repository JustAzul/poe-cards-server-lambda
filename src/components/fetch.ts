import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';

import type { CurrencyOverviewResponse } from '../types/currency-overview-response.type';
import DEFAULT_USER_AGENT from '../constants/user-agent';
import EventEmitter from 'events';
import FetchUtils from './fetch.utils';
import type { ItemOverviewDictionary } from '../types/item-overview-dictionary.type';
import type { ItemOverviewResponse } from '../types/item-overview-response.type';
import type { ItemOverviewType } from '../types/item-overview-types.type';
import { JobQueue } from '../types/job-queue.type';
import LEAGUE_OVERVIEW_FETCH_LIST from '../constants/fetch-list';
import type { LeagueCurrencyOverview } from '../types/league-currency-overview.type';
import type { LeagueItemsOverview } from '../types/league-items-overview.type';
import type { LeagueName } from '../types/league-name.type';
import type { LeagueOverview } from '../types/league-overview.type';
import type { LeagueResponse } from '../types/league-response.type';
import REQUEST_DELAY from '../constants/request-delay';

export default class Fetch {
  public static readonly Utils = FetchUtils;

  private static readonly Queue: JobQueue[] = [];

  private static readonly Events: EventEmitter = new EventEmitter();

  private static isQueueBeingProcessed = false;

  private static async ProcessQueue() {
    if (Fetch.isQueueBeingProcessed) return;

    Fetch.isQueueBeingProcessed = true;

    const job = Fetch.Queue.shift();

    if (job) {
      Fetch.Events.emit(job.id, await job.job());
    }

    if (Fetch.Queue.length > 0) {
      // eslint-disable-next-line no-promise-executor-return
      await new Promise((resolve) => setTimeout(resolve, REQUEST_DELAY));
    }

    Fetch.isQueueBeingProcessed = false;
    if (Fetch.Queue.length > 0) await Fetch.ProcessQueue();
  }

  private static async Get<T>(
    url: string,
    config?: AxiosRequestConfig<never>,
  ): Promise<AxiosResponse<T, never>> {
    const job: JobQueue = {
      id: Symbol(url),
      job: async () =>
        axios.get<T, AxiosResponse<T, never>, never>(url, {
          headers: {
            'user-agent': DEFAULT_USER_AGENT,
          },
          ...config,
        }),
    };

    Fetch.Queue.push(job);

    const [fetchResult] = await Promise.all([
      new Promise((resolve) =>
        // eslint-disable-next-line no-promise-executor-return
        Fetch.Events.once(job.id, (r) => resolve(r)),
      ),
      Fetch.ProcessQueue(),
    ]);

    return fetchResult as AxiosResponse<T, never>;
  }

  public static async LeaguesData(): Promise<LeagueResponse[]> {
    // eslint-disable-next-line no-console
    console.log('Fetching leagues data from poe.ninja..');

    const { data } = await Fetch.Get<LeagueResponse[]>(
      'https://api.pathofexile.com/leagues',
      {
        responseType: 'json',
      },
    );

    return Fetch.Utils.FilterLeagues(data);
  }

  private static async ItemOverview<T extends ItemOverviewType>(
    leagueName: LeagueName,
    overviewType: T,
  ): Promise<Array<ItemOverviewDictionary[T]>> {
    const params = {
      language: 'en',
      league: leagueName,
      type: overviewType,
    };

    const { data } = await Fetch.Get<
      ItemOverviewResponse<ItemOverviewDictionary[T]>
    >('https://poe.ninja/api/data/itemoverview', {
      responseType: 'json',
      params,
    });

    // eslint-disable-next-line no-console
    console.log(`[${leagueName}] Fetched '${overviewType}' item overview`);

    return data.lines;
  }

  private static async CurrencyOverview(
    leagueName: LeagueName,
  ): Promise<LeagueCurrencyOverview> {
    const params = {
      league: leagueName,
      type: 'Currency',
    };

    // eslint-disable-next-line no-console
    console.log(
      `[${leagueName}] Queueing currencies overview fetching process..`,
    );

    const { data } = await Fetch.Get<CurrencyOverviewResponse>(
      'https://poe.ninja/api/data/currencyoverview',
      {
        responseType: 'json',
        params,
      },
    );

    // eslint-disable-next-line no-console
    console.log(`[${leagueName}] Fetched currencies overview`);

    return {
      data: data.lines,
      details: data.currencyDetails,
    };
  }

  private static async LeagueItemsOverview(
    leagueName: LeagueName,
  ): Promise<LeagueItemsOverview> {
    const overviewsByName: LeagueItemsOverview = new Map();

    // eslint-disable-next-line no-console
    console.log(`[${leagueName}] Queueing items overview fetching process..`);

    await Promise.all(
      LEAGUE_OVERVIEW_FETCH_LIST.map((itemOverviewType) =>
        Fetch.ItemOverview(leagueName, itemOverviewType).then((overview) =>
          overviewsByName.set(itemOverviewType, overview),
        ),
      ),
    );

    return overviewsByName;
  }

  private static async LeagueOverview(
    leagueName: LeagueName,
  ): Promise<LeagueOverview> {
    const [currencyOverview, itemsOverview] = await Promise.all([
      Fetch.CurrencyOverview(leagueName),
      Fetch.LeagueItemsOverview(leagueName),
    ]);

    return {
      currencyOverview,
      itemsOverview,
    };
  }

  public static async LeaguesOverview<T extends LeagueName>(
    leagueNames: T[],
  ): Promise<Map<T, LeagueOverview>> {
    const leaguesOverview: Map<T, LeagueOverview> = new Map();

    await Promise.all(
      leagueNames.map((league) =>
        Fetch.LeagueOverview(league).then((leagueOverview) =>
          leaguesOverview.set(league, leagueOverview),
        ),
      ),
    );

    return leaguesOverview;
  }
}
