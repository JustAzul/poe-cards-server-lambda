import { ItemOverview } from '@domain/value-objects/item-overview';
import { CurrencyItem } from '@domain/value-objects/currency-item';
import { ItemClass } from '@domain/value-objects/item-class.enum';
import { League } from '@domain/entities/league.entity';
import { DivinationCardLine } from '@domain/services/reward-parser.service';
import { IMarketDataApiWithRaw } from '@infrastructure/ports/market-data-with-raw.port';
import { ILeagueDataAdapter } from '@infrastructure/ports/league-data-adapter.port';
import {
  DivCardDefinition,
  IDivCardDefinitionSource,
} from '@infrastructure/ports/div-card-definition-source.port';
import { IDivCardPriceSource } from '@infrastructure/ports/div-card-price-source.port';
import { ICurrencyPriceSource } from '@infrastructure/ports/currency-price-source.port';
import { PoeNinjaItemMeta } from '@infrastructure/types/poe-ninja-item-meta';
import { EnrichedLeagueDataYield } from '@infrastructure/types/enriched-league-data';
import { Logger } from '@shared/logger';

// Uniques (6 types) + SkillGem still come from the poe.ninja stash overview.
// Divination cards are sourced separately (poeatlas definitions × exchange prices).
const DEFAULT_ITEM_TYPES = [
  'UniqueArmour',
  'UniqueAccessory',
  'UniqueWeapon',
  'UniqueMap',
  'SkillGem',
  'UniqueFlask',
  'UniqueJewel',
];

interface DivinationCardData {
  items: ItemOverview[];
  cardLines: DivinationCardLine[];
  itemMeta: Map<string, PoeNinjaItemMeta>;
}

/**
 * ETL League Data Adapter
 * Adapts the HTTP services for fetching league overview data.
 * Divination-card definitions are fetched once per run (hoisted above the
 * league loop) and merged with per-league exchange prices; div-card and currency
 * prices come from the exchange endpoint; uniques/gems keep flowing through the
 * unchanged poe.ninja stash adapters.
 */
export class LeagueAdapter implements ILeagueDataAdapter {
  constructor(
    private readonly marketDataApi: IMarketDataApiWithRaw,
    private readonly definitionSource: IDivCardDefinitionSource,
    private readonly priceSource: IDivCardPriceSource,
    private readonly currencyPriceSource: ICurrencyPriceSource,
    private readonly logger: Logger,
    private readonly itemTypes: string[] = DEFAULT_ITEM_TYPES,
  ) {}

  /**
   * Fetch complete league overview (items + currency + card lines + item metadata)
   * Rate limiting is handled automatically by the HTTP client
   */
  private async fetchLeagueOverview(
    leagueName: string,
    definitions: Map<string, DivCardDefinition>,
  ): Promise<{
    items: ItemOverview[];
    currency: CurrencyItem[];
    cardLines: DivinationCardLine[];
    itemMeta: Map<string, PoeNinjaItemMeta>;
  }> {
    this.logger.log(`Requesting league '${leagueName}' Overview..`);

    const [currency, { items, cardLines, itemMeta }] = await Promise.all([
      this.currencyPriceSource.fetchCurrencyPrices(leagueName),
      this.fetchItemsOverview(leagueName, definitions),
    ]);

    return {
      items, currency, cardLines, itemMeta,
    };
  }

  private async fetchItemsOverview(
    leagueName: string,
    definitions: Map<string, DivCardDefinition>,
  ): Promise<DivinationCardData> {
    const [divResult, ...otherResults] = await Promise.all([
      this.fetchDivinationCards(leagueName, definitions),
      ...this.itemTypes.map(async (type) => {
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

  /**
   * Merge exchange prices (per league) with poeatlas definitions (per run) into
   * the div-card ItemOverview set, plus the card lines and presentation metadata.
   */
  private async fetchDivinationCards(
    leagueName: string,
    definitions: Map<string, DivCardDefinition>,
  ): Promise<DivinationCardData> {
    const prices = await this.priceSource.fetchPrices(leagueName);

    const items: ItemOverview[] = [];
    const cardLines: DivinationCardLine[] = [];
    const itemMeta = new Map<string, PoeNinjaItemMeta>();
    let orphanCount = 0;

    for (const price of prices) {
      const definition = definitions.get(price.slug);

      if (definition) {
        items.push(new ItemOverview({
          name: definition.name,
          itemClass: ItemClass.DIVINATION_CARD,
          chaosValue: price.chaosValue,
          stackSize: definition.stackSize,
          volumePrimaryValue: price.volumePrimaryValue,
        }));
        cardLines.push({
          name: definition.name,
          explicitModifiers: definition.explicitModifiers,
        });
        itemMeta.set(definition.name, {
          artFilename: definition.artFilename,
          flavourText: definition.flavourText,
        });
      } else {
        orphanCount += 1;
      }
    }

    if (orphanCount > 0) {
      this.logger.warn(`[LeagueAdapter] ${orphanCount} exchange-priced ${leagueName} cards had no poeatlas definition`);
    }

    this.logger.log(`Found ${items.length} ${leagueName} DivinationCard's! (${prices.length} priced, ${orphanCount} without definition)`);

    return { items, cardLines, itemMeta };
  }

  /**
   * Fetch league overview data for multiple leagues
   * Generator function that yields data for each league as it's fetched.
   * Div-card definitions are fetched once (bulk) before the per-league loop.
   */
  async* fetchBatchLeagueOverview(leagues: League[]): AsyncGenerator<EnrichedLeagueDataYield> {
    const definitions = await this.definitionSource.fetchDefinitions();
    this.logger.log(`Loaded ${definitions.size} divination-card definitions for ${leagues.length} league(s)`);

    for (const league of leagues) {
      try {
        const timestamp = new Date().toISOString();
        /* eslint-disable no-await-in-loop */
        const {
          items, currency, cardLines, itemMeta,
        } = await this.fetchLeagueOverview(league.name, definitions);
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
