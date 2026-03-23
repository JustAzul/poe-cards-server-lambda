import { ItemOverview } from '@domain/value-objects/item-overview';
import { CurrencyItem } from '@domain/value-objects/currency-item';
import { League } from '@domain/entities/league.entity';
import { IMarketDataApi } from '@domain/ports/http-service.port';
import { ILeagueAdapter, LeagueDataYield } from '@domain/ports/league-adapter.port';
import { Logger } from '@shared/logger';

const ITEM_TYPES_TO_FETCH = [
  'DivinationCard',
  'UniqueArmour',
  'UniqueAccessory',
  'UniqueWeapon',
  'UniqueMap',
  'SkillGem',
  'UniqueFlask',
  'UniqueJewel',
];

/**
 * ETL League Data Adapter
 * Adapts the HTTP service for fetching league overview data
 * Coordinates batch fetching with rate limiting
 */
export class LeagueAdapter implements ILeagueAdapter {
  constructor(
    private readonly marketDataApi: IMarketDataApi,
    private readonly logger: Logger = console,
  ) {}

  /**
   * Fetch complete league overview (items + currency)
   * Rate limiting is handled automatically by the HTTP client
   * @param leagueName - League name (e.g., "Standard", "Affliction")
   * @returns Object with separate items and currency arrays
   */
  private async fetchLeagueOverview(
    leagueName: string,
  ): Promise<{ items: ItemOverview[]; currency: CurrencyItem[] }> {
    this.logger.log(`Requesting league '${leagueName}' Overview..`);

    const [currency, items] = await Promise.all([
      this.marketDataApi.fetchCurrencyOverview(leagueName),
      this.fetchItemsOverview(leagueName),
    ]);

    return { items, currency };
  }

  private async fetchItemsOverview(leagueName: string): Promise<ItemOverview[]> {
    const itemArrays = await Promise.all(
      ITEM_TYPES_TO_FETCH.map(async (type) => {
        const items = await this.marketDataApi.fetchItemOverview(leagueName, type);
        this.logger.log(`Found ${items.length} ${leagueName} ${type}'s!`);
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
  async* fetchBatchLeagueOverview(leagues: League[]): AsyncGenerator<LeagueDataYield> {
    for (const league of leagues) {
      try {
        // eslint-disable-next-line no-await-in-loop
        const { items, currency } = await this.fetchLeagueOverview(league.name);
        const timestamp = new Date().toISOString();

        yield {
          league,
          items,
          currency,
          timestamp,
        };
      } catch (error) {
        const fetchError = error instanceof Error ? error : new Error(String(error));
        this.logger.error(`Failed to fetch league ${league.name}:`, fetchError.message);
        yield {
          league,
          items: [],
          currency: [],
          timestamp: '',
          error: fetchError,
        };
      }
    }
  }
}
