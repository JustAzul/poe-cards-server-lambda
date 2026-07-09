import { League } from '@domain/entities/league.entity';
import { ItemOverview } from '@domain/value-objects/item-overview';
import { CurrencyItem } from '@domain/value-objects/currency-item';
import { ItemClass } from '@domain/value-objects/item-class.enum';
import { LeagueAdapter } from '@infrastructure/adapters/league.adapter';
import { DivCardDefinition } from '@infrastructure/ports/div-card-definition-source.port';
import { DivCardPrice } from '@infrastructure/ports/div-card-price-source.port';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// eslint-disable-next-line no-empty-function
const silentLogger = { log: () => {}, warn: () => {}, error: () => {} };

function buildLeague(overrides: Partial<ConstructorParameters<typeof League>[0]> = {}): League {
  return new League({
    name: 'Settlers',
    ladder: 'Settlers',
    delveEvent: false,
    realm: 'pc',
    startAt: new Date('2025-01-01'),
    endAt: new Date('2025-04-01'),
    ruleIds: [],
    ...overrides,
  });
}

function buildDefinition(overrides: Partial<DivCardDefinition> = {}): DivCardDefinition {
  return {
    name: 'The Doctor',
    explicitModifiers: [{ text: '<uniqueitem>{Headhunter}', optional: false }],
    artFilename: 'Art/2DItems/Divination/TheDoctor.png',
    flavourText: 'Wealth beyond measure.',
    stackSize: 8,
    ...overrides,
  };
}

function buildPrice(overrides: Partial<DivCardPrice> = {}): DivCardPrice {
  return {
    slug: 'the-doctor',
    name: 'The Doctor',
    chaosValue: 500,
    volumePrimaryValue: 42,
    ...overrides,
  };
}

function buildItemOverview(
  overrides: Partial<ConstructorParameters<typeof ItemOverview>[0]> = {},
): ItemOverview {
  return new ItemOverview({
    name: 'Headhunter',
    itemClass: ItemClass.UNIQUE,
    chaosValue: 5000,
    count: 20,
    ...overrides,
  });
}

// ---------------------------------------------------------------------------
// Collaborator mock factories
// ---------------------------------------------------------------------------

function makeMarketDataApi(overrides: {
  fetchItemOverview?: jest.Mock;
} = {}) {
  return {
    fetchRawItemLines: jest.fn().mockResolvedValue([]),
    fetchItemOverview: overrides.fetchItemOverview ?? jest.fn().mockResolvedValue([]),
  };
}

function makeDefinitionSource(defs: Array<[string, DivCardDefinition]> = []) {
  return { fetchDefinitions: jest.fn().mockResolvedValue(new Map(defs)) };
}

function makePriceSource(prices: DivCardPrice[] = []) {
  return { fetchPrices: jest.fn().mockResolvedValue(prices) };
}

function makeCurrencyPriceSource(currency: CurrencyItem[] = []) {
  return { fetchCurrencyPrices: jest.fn().mockResolvedValue(currency) };
}

function buildAdapter(collaborators: {
  marketDataApi?: ReturnType<typeof makeMarketDataApi>;
  definitionSource?: ReturnType<typeof makeDefinitionSource>;
  priceSource?: ReturnType<typeof makePriceSource>;
  currencyPriceSource?: ReturnType<typeof makeCurrencyPriceSource>;
} = {}) {
  const marketDataApi = collaborators.marketDataApi ?? makeMarketDataApi();
  const definitionSource = collaborators.definitionSource ?? makeDefinitionSource();
  const priceSource = collaborators.priceSource ?? makePriceSource();
  const currencyPriceSource = collaborators.currencyPriceSource ?? makeCurrencyPriceSource();

  const adapter = new LeagueAdapter(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    marketDataApi as any,
    definitionSource,
    priceSource,
    currencyPriceSource,
    silentLogger,
  );

  return {
    adapter, marketDataApi, definitionSource, priceSource, currencyPriceSource,
  };
}

async function collectYields(adapter: LeagueAdapter, leagues: League[]) {
  const results = [];
  for await (const result of adapter.fetchBatchLeagueOverview(leagues)) {
    results.push(result);
  }
  return results;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('LeagueAdapter.fetchBatchLeagueOverview', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('yields enriched data for each league', () => {
    it('should yield one result per league provided', async () => {
      const leagueA = buildLeague({ name: 'Mirage' });
      const leagueB = buildLeague({ name: 'Ancestors' });
      const { adapter } = buildAdapter();

      const results = await collectYields(adapter, [leagueA, leagueB]);

      expect(results).toHaveLength(2);
      expect(results[0].league).toBe(leagueA);
      expect(results[1].league).toBe(leagueB);
    });

    it('should include a non-empty timestamp in each yield', async () => {
      const league = buildLeague();
      const { adapter } = buildAdapter();

      const results = await collectYields(adapter, [league]);

      expect(results[0].timestamp).toBeTruthy();
      expect(typeof results[0].timestamp).toBe('string');
    });
  });

  describe('divination cards (poeatlas definitions × exchange prices)', () => {
    it('should merge price and definition into an ItemOverview, cardLine and itemMeta', async () => {
      const league = buildLeague({ name: 'Mirage' });
      const definition = buildDefinition({ name: 'The Doctor', stackSize: 8 });
      const price = buildPrice({
        slug: 'the-doctor', name: 'The Doctor', chaosValue: 500, volumePrimaryValue: 42,
      });

      const { adapter } = buildAdapter({
        definitionSource: makeDefinitionSource([['the-doctor', definition]]),
        priceSource: makePriceSource([price]),
      });

      const [result] = await collectYields(adapter, [league]);

      const card = result.items.find((i) => i.name === 'The Doctor');
      expect(card).toBeDefined();
      expect(card?.itemClass).toBe(ItemClass.DIVINATION_CARD);
      expect(card?.chaosValue).toBe(500);
      expect(card?.stackSize).toBe(8);
      expect(card?.volumePrimaryValue).toBe(42);

      expect(result.cardLines).toEqual([
        { name: 'The Doctor', explicitModifiers: definition.explicitModifiers },
      ]);
      expect(result.itemMeta.get('The Doctor')).toEqual({
        artFilename: definition.artFilename,
        flavourText: definition.flavourText,
      });
    });

    it('should skip a priced card that has no definition (orphan guard) and keep the rest', async () => {
      const league = buildLeague({ name: 'Mirage' });
      const definition = buildDefinition({ name: 'The Doctor' });

      const { adapter } = buildAdapter({
        definitionSource: makeDefinitionSource([['the-doctor', definition]]),
        priceSource: makePriceSource([
          buildPrice({ slug: 'the-doctor', name: 'The Doctor' }),
          buildPrice({ slug: 'ghost-card', name: 'Ghost Card' }),
        ]),
      });

      const [result] = await collectYields(adapter, [league]);

      const names = result.items.map((i) => i.name);
      expect(names).toContain('The Doctor');
      expect(names).not.toContain('Ghost Card');
      expect(result.cardLines).toHaveLength(1);
    });

    it('should fetch definitions exactly once across multiple leagues', async () => {
      const leagueA = buildLeague({ name: 'Mirage' });
      const leagueB = buildLeague({ name: 'Ancestors' });

      const { adapter, definitionSource, priceSource } = buildAdapter({
        definitionSource: makeDefinitionSource([['the-doctor', buildDefinition()]]),
        priceSource: makePriceSource([buildPrice()]),
      });

      await collectYields(adapter, [leagueA, leagueB]);

      expect(definitionSource.fetchDefinitions).toHaveBeenCalledTimes(1);
      expect(priceSource.fetchPrices).toHaveBeenCalledTimes(2);
      expect(priceSource.fetchPrices).toHaveBeenCalledWith('Mirage');
      expect(priceSource.fetchPrices).toHaveBeenCalledWith('Ancestors');
    });
  });

  describe('non-divination types (unchanged poe.ninja stash path)', () => {
    it('should call fetchItemOverview for the unique/gem types but never for DivinationCard', async () => {
      const league = buildLeague();
      const fetchItemOverview = jest.fn().mockResolvedValue([buildItemOverview()]);
      const { adapter } = buildAdapter({
        marketDataApi: makeMarketDataApi({ fetchItemOverview }),
      });

      await collectYields(adapter, [league]);

      expect(fetchItemOverview).toHaveBeenCalledWith('Settlers', 'UniqueArmour');
      expect(fetchItemOverview).toHaveBeenCalledWith('Settlers', 'SkillGem');
      expect(fetchItemOverview).not.toHaveBeenCalledWith('Settlers', 'DivinationCard');
    });
  });

  describe('error handling', () => {
    it('should yield an error result with empty data when currency fetch throws', async () => {
      const league = buildLeague({ name: 'Mirage' });
      const { adapter } = buildAdapter({
        currencyPriceSource: {
          fetchCurrencyPrices: jest.fn().mockRejectedValue(new Error('Network timeout')),
        },
      });

      const [result] = await collectYields(adapter, [league]);

      expect(result.league).toBe(league);
      expect(result.error).toBeInstanceOf(Error);
      expect(result.items).toEqual([]);
      expect(result.currency).toEqual([]);
      expect(result.cardLines).toEqual([]);
      expect(result.itemMeta).toEqual(new Map());
      expect(result.timestamp).toBe('');
    });

    it('should yield an error for a league whose price fetch fails, then continue', async () => {
      const leagueA = buildLeague({ name: 'Mirage' });
      const leagueB = buildLeague({ name: 'Ancestors' });

      const fetchPrices = jest.fn()
        .mockRejectedValueOnce(new Error('exchange 404'))
        .mockResolvedValueOnce([]);

      const { adapter } = buildAdapter({
        definitionSource: makeDefinitionSource([['the-doctor', buildDefinition()]]),
        priceSource: { fetchPrices },
      });

      const results = await collectYields(adapter, [leagueA, leagueB]);

      expect(results).toHaveLength(2);
      expect(results[0].error).toBeInstanceOf(Error);
      expect(results[1].error).toBeUndefined();
      expect(results[1].league).toBe(leagueB);
    });
  });
});
