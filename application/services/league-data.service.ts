import { ILeagueDataService } from '../interfaces/services.interface';
import { ItemOverview, CurrencyItem } from '@domain/entities/http.entity';
import { httpRepository } from '@infrastructure/repositories/http.repository';
import { sleep } from 'azul-tools';
import { duration } from 'moment';

const fetchList = require('../../config/fetch-list');

export class LeagueDataService implements ILeagueDataService {
  private readonly DELAY_SECONDS = 2;

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
}

export const leagueDataService = new LeagueDataService();
