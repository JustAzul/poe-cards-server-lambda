/* eslint-disable no-console */
import { ItemOverview, CurrencyItem } from '@domain/entities/http.entity';
import { LeagueEntity } from '@domain/entities/league.entity';
import { httpService } from '@infrastructure/services/http.service';
import { ILeagueDataService } from '@domain/repositories/interfaces/league-data.service.interface';

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
  /**
   * Fetch complete league overview (items + currency)
   * Rate limiting is handled automatically by the HTTP client
   * @param leagueName - League name (e.g., "Standard", "Affliction")
   * @returns Combined array of items and currency
   */
  async fetchLeagueOverview(leagueName: string): Promise<Array<ItemOverview | CurrencyItem>> {
    console.log(`Requesting league '${leagueName}' Currency..`);
    const currencyData = await httpService.fetchCurrencyOverview(leagueName);

    const itemsData = await this.fetchItemsData(leagueName);

    return [...itemsData, ...currencyData];
  }

  private async fetchItemsData(leagueName: string): Promise<ItemOverview[]> {
    const results: ItemOverview[] = [];

    for (const type of fetchList) {
      console.log(`Request league '${leagueName}' ${type}'s..`);

      const items = await httpService.fetchItemOverview(leagueName, type);
      console.log(`Found ${items.length} ${leagueName} ${type}'s!`);

      results.push(...items);
    }

    return results;
  }

  /**
   * Fetch league overview data for multiple leagues
   * Generator function that yields data for each league as it's fetched
   * Rate limiting is handled automatically by the HTTP client
   *
   * @param leagues - Array of league entities to fetch data for
   * @yields Individual league data with timestamp for each league
   */
  async* fetchBatchLeagueOverview(leagues: LeagueEntity[]): AsyncGenerator<LeagueDataYield> {
    for (const league of leagues) {
      console.log(`Requesting league '${league.name}' Overview..`);

      const data = await this.fetchLeagueOverview(league.name);
      const timestamp = new Date().toISOString();

      yield { league, data, timestamp };
    }
  }
}

export const leagueDataService = new LeagueDataService();
