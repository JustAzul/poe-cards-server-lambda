/* eslint-disable no-console */
import { ItemOverview, CurrencyItem } from '@domain/entities/http.entity';
import { LeagueEntity } from '@domain/entities/league.entity';
import { httpRepository } from '@infrastructure/repositories/http.repository';
import { sleep } from '@shared/utils';
import { duration } from 'moment';
import { ILeagueDataService } from '../interfaces/services.interface';

const fetchList = require('../../config/fetch-list');

/**
 * Individual league data result yielded by generator
 */
export interface LeagueDataYield {
  league: LeagueEntity;
  data: Array<ItemOverview | CurrencyItem>;
  timestamp: string;
}

export class LeagueDataService implements ILeagueDataService {
  private readonly DELAY_SECONDS = 2;

  private readonly LEAGUE_DELAY_SECONDS = 2;

  /**
   * Fetch complete league overview (items + currency)
   * @param leagueName - League name (e.g., "Standard", "Affliction")
   * @returns Combined array of items and currency
   */
  async fetchLeagueOverview(leagueName: string): Promise<Array<ItemOverview | CurrencyItem>> {
    const currencyData = await this.fetchCurrencyData(leagueName);
    await this.delay();
    const itemsData = await this.fetchItemsData(leagueName);

    return [...itemsData, ...currencyData];
  }

  private async fetchCurrencyData(leagueName: string): Promise<CurrencyItem[]> {
    console.log(`Requesting league '${leagueName}' Currency..`);
    return await httpRepository.fetchCurrencyOverview(leagueName);
  }

  private async fetchItemsData(leagueName: string): Promise<ItemOverview[]> {
    const results: ItemOverview[] = [];

    for (let i = 0; i < fetchList.length; i++) {
      const type = fetchList[i];
      console.log(`Request league '${leagueName}' ${type}'s..`);

      const items = await httpRepository.fetchItemOverview(leagueName, type);
      console.log(`Found ${items.length} ${leagueName} ${type}'s!`);

      results.push(...items);

      // Delay between requests (except after last request)
      if (i !== fetchList.length - 1) {
        await this.delay();
      }
    }

    return results;
  }

  private async delay(): Promise<void> {
    console.log(`Waiting ${this.DELAY_SECONDS} seconds delay..`);
    await sleep(duration(this.DELAY_SECONDS, 'seconds').asMilliseconds());
  }

  /**
   * Fetch league overview data for multiple leagues with rate limiting
   * Generator function that yields data for each league as it's fetched
   * Processes leagues sequentially with delays to respect API constraints
   *
   * @param leagues - Array of league entities to fetch data for
   * @yields Individual league data with timestamp for each league
   */
  async* fetchBatchLeagueOverview(leagues: LeagueEntity[]): AsyncGenerator<LeagueDataYield> {
    // Sequential processing with rate limiting to respect API constraints
    for (let i = 0; i < leagues.length; i += 1) {
      const league = leagues[i];

      console.log(`Requesting league '${league.name}' Overview..`);

      // eslint-disable-next-line no-await-in-loop
      const data = await this.fetchLeagueOverview(league.name);
      const timestamp = new Date().toISOString();

      // Yield individual league result with full league entity
      yield { league, data, timestamp };

      // Add delay between league requests (except after the last one)
      if (i !== leagues.length - 1) {
        console.log(`Waiting ${this.LEAGUE_DELAY_SECONDS} seconds delay..`);
        // eslint-disable-next-line no-await-in-loop
        await sleep(duration(this.LEAGUE_DELAY_SECONDS, 'seconds').asMilliseconds());
      }
    }
  }
}

export const leagueDataService = new LeagueDataService();
