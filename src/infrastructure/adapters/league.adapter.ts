import { ItemOverview } from '@domain/value-objects/item-overview';
import { CurrencyItem } from '@domain/value-objects/currency-item';
import { League } from '@domain/entities/league.entity';
import { DivinationCardLine } from '@domain/services/reward-parser.service';
import { IMarketDataApiWithRaw } from '@infrastructure/ports/market-data-with-raw.port';
import { ILeagueDataAdapter } from '@infrastructure/ports/league-data-adapter.port';
import { PoeNinjaItemMeta } from '@infrastructure/types/poe-ninja-item-meta';
import { EnrichedLeagueDataYield } from '@infrastructure/types/enriched-league-data';
import { Logger } from '@shared/logger';

const DEFAULT_ITEM_TYPES = [
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
export class LeagueAdapter implements ILeagueDataAdapter {
  constructor(
    private readonly marketDataApi: IMarketDataApiWithRaw,
    private readonly logger: Logger,
    private readonly itemTypes: string[] = DEFAULT_ITEM_TYPES,
  ) {}

  /**
   * Fetch complete league overview (items + currency + card lines + item metadata)
   * Rate limiting is handled automatically by the HTTP client
   */
  private async fetchLeagueOverview(leagueName: string): Promise<{
    items: ItemOverview[];
    currency: CurrencyItem[];
    cardLines: DivinationCardLine[];
    itemMeta: Map<string, PoeNinjaItemMeta>;
  }> {
    this.logger.log(`Requesting league '${leagueName}' Overview..`);

    const [currency, { items, cardLines, itemMeta }] = await Promise.all([
      this.marketDataApi.fetchCurrencyOverview(leagueName),
      this.fetchItemsOverview(leagueName),
    ]);

    return {
      items, currency, cardLines, itemMeta,
    };
  }

  private async fetchItemsOverview(leagueName: string): Promise<{
    items: ItemOverview[];
    cardLines: DivinationCardLine[];
    itemMeta: Map<string, PoeNinjaItemMeta>;
  }> {
    const otherTypes = this.itemTypes.filter((t) => t !== 'DivinationCard');
    const hasDivinationCards = this.itemTypes.includes('DivinationCard');

    const [divResult, ...otherResults] = await Promise.all([
      hasDivinationCards
        ? this.fetchDivinationCards(leagueName)
        : Promise.resolve({ items: [] as ItemOverview[], cardLines: [], itemMeta: new Map() }),
      ...otherTypes.map(async (type) => {
        const items = await this.marketDataApi.fetchItemOverview(leagueName, type);
        this.logger.log(`Found ${items.length} ${leagueName} ${type}'s!`);
        return items;
      }),
    ]);

    const allItems = [
      ...divResult.items,
      ...otherResults.flat(),
    ];

    return {
      items: allItems,
      cardLines: divResult.cardLines,
      itemMeta: divResult.itemMeta,
    };
  }

  private async fetchDivinationCards(leagueName: string): Promise<{
    items: ItemOverview[];
    cardLines: DivinationCardLine[];
    itemMeta: Map<string, PoeNinjaItemMeta>;
  }> {
    const rawLines = await this.marketDataApi.fetchRawItemLines(leagueName, 'DivinationCard');
    this.logger.log(`Found ${rawLines.length} ${leagueName} DivinationCard's!`);

    const cardLines: DivinationCardLine[] = [];
    const itemMeta = new Map<string, PoeNinjaItemMeta>();

    const items = rawLines.map((line) => {
      cardLines.push({
        name: line.name,
        explicitModifiers: line.explicitModifiers,
      });
      itemMeta.set(line.name, {
        artFilename: line.artFilename,
        flavourText: line.flavourText,
      });
      return new ItemOverview({
        name: line.name,
        itemClass: line.itemClass,
        chaosValue: line.chaosValue,
        corrupted: line.corrupted,
        links: line.links,
        gemLevel: line.gemLevel,
        count: line.count,
        stackSize: line.stackSize,
      });
    });

    return { items, cardLines, itemMeta };
  }

  /**
   * Fetch league overview data for multiple leagues
   * Generator function that yields data for each league as it's fetched
   */
  async* fetchBatchLeagueOverview(leagues: League[]): AsyncGenerator<EnrichedLeagueDataYield> {
    for (const league of leagues) {
      try {
        const timestamp = new Date().toISOString();
        /* eslint-disable no-await-in-loop */
        const {
          items, currency, cardLines, itemMeta,
        } = await this.fetchLeagueOverview(league.name);
        /* eslint-enable no-await-in-loop */

        yield {
          league,
          items,
          currency,
          timestamp,
          cardLines,
          itemMeta,
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
          cardLines: [],
          itemMeta: new Map(),
        };
      }
    }
  }
}
