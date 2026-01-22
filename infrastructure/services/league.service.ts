/* eslint-disable no-console */
import { ItemOverview, CurrencyItem } from '@domain/entities/http.entity';
import { LeagueEntity } from '@domain/entities/league.entity';
import { IHttpService } from '@domain/services/interfaces/http.service.interface';
import { ILeagueService } from '@domain/repositories/interfaces/league.service.interface';
import { httpService as _httpService } from '@infrastructure/services/http.service';

const fetchList = require('../../config/fetch-list');

/**
 * Individual league data result yielded by generator
 */
export interface LeagueDataYield {
  league: LeagueEntity;
  items: ItemOverview[];
  currency: CurrencyItem[];
  timestamp: string;
}

export class LeagueService implements ILeagueService {
  constructor(private readonly httpService: IHttpService) {}

  /**
   * Fetch complete league overview (items + currency)
   * Rate limiting is handled automatically by the HTTP client
   * @param leagueName - League name (e.g., "Standard", "Affliction")
   * @returns Object with separate items and currency arrays
   */
  private async fetchLeagueOverview(
    leagueName: string,
  ): Promise<{ items: ItemOverview[]; currency: CurrencyItem[] }> {
    console.log(`Requesting league '${leagueName}' Overview..`);

    const [currency, items] = await Promise.all([
      this.httpService.fetchCurrencyOverview(leagueName),
      this.fetchItemsOverview(leagueName),
    ]);

    return { items, currency };
  }

  private async fetchItemsOverview(leagueName: string): Promise<ItemOverview[]> {
    const itemArrays = await Promise.all(
      fetchList.map(async (type: string) => {
        const items = await this.httpService.fetchItemOverview(leagueName, type);
        console.log(`Found ${items.length} ${leagueName} ${type}'s!`);
        return items;
      }),
    );

    return itemArrays.flat();
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
    // eslint-disable-next-line no-restricted-syntax
    for (const league of leagues) {
      // eslint-disable-next-line no-await-in-loop
      const { items, currency } = await this.fetchLeagueOverview(league.name);
      const timestamp = new Date().toISOString();

      yield {
        league,
        items,
        currency,
        timestamp,
      };
    }
  }
}

export const leagueService = new LeagueService(_httpService);
