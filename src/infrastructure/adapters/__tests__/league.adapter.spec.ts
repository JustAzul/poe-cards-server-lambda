import { League } from '@domain/entities/league.entity';
import { ItemOverview } from '@domain/value-objects/item-overview';
import { CurrencyItem } from '@domain/value-objects/currency-item';
import { ItemClass } from '@domain/value-objects/item-class.enum';
import { LeagueAdapter } from '@infrastructure/adapters/league.adapter';
import { PoeNinjaItemLine } from '@infrastructure/types/poe-ninja.types';

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

function buildRawItemLine(overrides: Partial<PoeNinjaItemLine> = {}): PoeNinjaItemLine {
  return {
    name: 'The Doctor',
    itemClass: ItemClass.DIVINATION_CARD,
    chaosValue: 500,
    count: 50,
    stackSize: 8,
    artFilename: 'Art/2DItems/Divination/TheDoctor.png',
    flavourText: 'Wealth beyond measure.',
    explicitModifiers: [{ text: '<uniqueitem>{Headhunter}', optional: false }],
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

function buildCurrencyItem(name = 'Chaos Orb'): CurrencyItem {
  return new CurrencyItem({ currencyTypeName: name, chaosEquivalent: 1 });
}

// ---------------------------------------------------------------------------
// Market data API mock factory
// ---------------------------------------------------------------------------

function makeMarketDataApi(overrides: {
  fetchRawItemLines?: jest.Mock;
  fetchItemOverview?: jest.Mock;
  fetchCurrencyOverview?: jest.Mock;
} = {}) {
  return {
    fetchRawItemLines: overrides.fetchRawItemLines ?? jest.fn().mockResolvedValue([]),
    fetchItemOverview: overrides.fetchItemOverview ?? jest.fn().mockResolvedValue([]),
    fetchCurrencyOverview: overrides.fetchCurrencyOverview ?? jest.fn().mockResolvedValue([]),
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
      const leagueA = buildLeague({ name: 'Settlers' });
      const leagueB = buildLeague({ name: 'Standard' });

      const marketDataApi = makeMarketDataApi({
        fetchCurrencyOverview: jest.fn().mockResolvedValue([buildCurrencyItem()]),
        fetchRawItemLines: jest.fn().mockResolvedValue([buildRawItemLine()]),
        fetchItemOverview: jest.fn().mockResolvedValue([buildItemOverview()]),
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const adapter = new LeagueAdapter(marketDataApi as any, silentLogger);
      const results = await collectYields(adapter, [leagueA, leagueB]);

      expect(results).toHaveLength(2);
      expect(results[0].league).toBe(leagueA);
      expect(results[1].league).toBe(leagueB);
    });

    it('should include a non-empty timestamp in each yield', async () => {
      const league = buildLeague();
      const marketDataApi = makeMarketDataApi({
        fetchCurrencyOverview: jest.fn().mockResolvedValue([]),
        fetchRawItemLines: jest.fn().mockResolvedValue([]),
        fetchItemOverview: jest.fn().mockResolvedValue([]),
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const adapter = new LeagueAdapter(marketDataApi as any, silentLogger);
      const results = await collectYields(adapter, [league]);

      expect(results[0].timestamp).toBeTruthy();
      expect(typeof results[0].timestamp).toBe('string');
    });
  });

  describe('DivinationCard type', () => {
    it('should call fetchRawItemLines and build cardLines + itemMeta for divination cards', async () => {
      const league = buildLeague({ name: 'Settlers' });
      const rawLine = buildRawItemLine({ name: 'The Doctor' });
      const fetchRawItemLines = jest.fn().mockResolvedValue([rawLine]);

      const marketDataApi = makeMarketDataApi({
        fetchRawItemLines,
        fetchCurrencyOverview: jest.fn().mockResolvedValue([]),
        fetchItemOverview: jest.fn().mockResolvedValue([]),
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const adapter = new LeagueAdapter(marketDataApi as any, silentLogger);
      const results = await collectYields(adapter, [league]);

      expect(fetchRawItemLines).toHaveBeenCalledWith('Settlers', 'DivinationCard');

      const result = results[0];
      expect(result.cardLines).toHaveLength(1);
      expect(result.cardLines[0].name).toBe('The Doctor');
      expect(result.cardLines[0].explicitModifiers).toEqual(rawLine.explicitModifiers);

      expect(result.itemMeta.get('The Doctor')).toEqual({
        artFilename: rawLine.artFilename,
        flavourText: rawLine.flavourText,
      });
    });

    it('should include divination card as an ItemOverview in the items array', async () => {
      const league = buildLeague();
      const rawLine = buildRawItemLine({ name: 'The Doctor', chaosValue: 500, stackSize: 8 });
      const fetchRawItemLines = jest.fn().mockResolvedValue([rawLine]);

      const marketDataApi = makeMarketDataApi({
        fetchRawItemLines,
        fetchCurrencyOverview: jest.fn().mockResolvedValue([]),
        fetchItemOverview: jest.fn().mockResolvedValue([]),
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const adapter = new LeagueAdapter(marketDataApi as any, silentLogger);
      const results = await collectYields(adapter, [league]);

      const doctorItem = results[0].items.find((i) => i.name === 'The Doctor');
      expect(doctorItem).toBeDefined();
      expect(doctorItem?.chaosValue).toBe(500);
      expect(doctorItem?.stackSize).toBe(8);
    });
  });

  describe('non-DivinationCard types', () => {
    it('should call fetchItemOverview for non-divination-card types', async () => {
      const league = buildLeague();
      const fetchItemOverview = jest.fn().mockResolvedValue([buildItemOverview()]);

      const marketDataApi = makeMarketDataApi({
        fetchRawItemLines: jest.fn().mockResolvedValue([]),
        fetchCurrencyOverview: jest.fn().mockResolvedValue([]),
        fetchItemOverview,
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const adapter = new LeagueAdapter(marketDataApi as any, silentLogger);
      await collectYields(adapter, [league]);

      expect(fetchItemOverview).toHaveBeenCalledWith('Settlers', 'UniqueArmour');
      expect(fetchItemOverview).toHaveBeenCalledWith('Settlers', 'UniqueWeapon');
      expect(fetchItemOverview).toHaveBeenCalledWith('Settlers', 'SkillGem');
    });
  });

  describe('error handling', () => {
    it('should yield an error result with empty data when fetch throws', async () => {
      const league = buildLeague({ name: 'Settlers' });
      const networkError = new Error('Network timeout');

      const marketDataApi = makeMarketDataApi({
        fetchCurrencyOverview: jest.fn().mockRejectedValue(networkError),
        fetchRawItemLines: jest.fn().mockResolvedValue([]),
        fetchItemOverview: jest.fn().mockResolvedValue([]),
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const adapter = new LeagueAdapter(marketDataApi as any, silentLogger);
      const results = await collectYields(adapter, [league]);

      expect(results).toHaveLength(1);
      expect(results[0].league).toBe(league);
      expect(results[0].error).toBeInstanceOf(Error);
      expect(results[0].items).toEqual([]);
      expect(results[0].currency).toEqual([]);
      expect(results[0].cardLines).toEqual([]);
      expect(results[0].itemMeta).toEqual(new Map());
      expect(results[0].timestamp).toBe('');
    });

    it('should continue yielding subsequent leagues after one fails', async () => {
      const leagueA = buildLeague({ name: 'Settlers' });
      const leagueB = buildLeague({ name: 'Standard' });

      const fetchCurrencyOverview = jest.fn()
        .mockRejectedValueOnce(new Error('Timeout'))
        .mockResolvedValueOnce([]);

      const marketDataApi = makeMarketDataApi({
        fetchCurrencyOverview,
        fetchRawItemLines: jest.fn().mockResolvedValue([]),
        fetchItemOverview: jest.fn().mockResolvedValue([]),
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const adapter = new LeagueAdapter(marketDataApi as any, silentLogger);
      const results = await collectYields(adapter, [leagueA, leagueB]);

      expect(results).toHaveLength(2);
      expect(results[0].error).toBeInstanceOf(Error);
      expect(results[1].error).toBeUndefined();
      expect(results[1].league).toBe(leagueB);
    });
  });
});
