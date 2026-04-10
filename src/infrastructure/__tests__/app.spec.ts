import { League } from '@domain/entities/league.entity';
import { ItemOverview } from '@domain/value-objects/item-overview';
import { CurrencyItem } from '@domain/value-objects/currency-item';
import { DivinationCard } from '@domain/entities/card.entity';
import { IExtractAdapter, LeagueExtractionYield } from '@infrastructure/adapters/etl/extract.adapter';
import { ITransformAdapter, SingleLeagueTransformResult } from '@infrastructure/adapters/etl/transform.adapter';
import { ILoadAdapter } from '@infrastructure/adapters/etl/load.adapter';
import { PoeNinjaItemMeta } from '@infrastructure/types/poe-ninja-item-meta';
import { App } from '@infrastructure/app';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// eslint-disable-next-line no-empty-function
const silentLogger = { log: () => {}, warn: () => {}, error: () => {} };

function buildLeague(name = 'Settlers'): League {
  return new League({
    name,
    ladder: name,
    delveEvent: false,
    realm: 'pc',
    startAt: new Date('2025-01-01'),
    endAt: new Date('2025-04-01'),
    ruleIds: [],
  });
}

function buildExtractionYield(
  league: League,
  overrides: Partial<LeagueExtractionYield> = {},
): LeagueExtractionYield {
  return {
    league,
    data: {
      items: [] as ItemOverview[],
      currency: [] as CurrencyItem[],
      cards: [] as DivinationCard[],
      itemMeta: new Map<string, PoeNinjaItemMeta>(),
      timestamp: '2025-01-01T00:00:00.000Z',
    },
    ...overrides,
  };
}

function buildErrorYield(league: League, error: Error): LeagueExtractionYield {
  return {
    league,
    data: {
      items: [],
      currency: [],
      cards: [],
      itemMeta: new Map<string, PoeNinjaItemMeta>(),
      timestamp: '',
    },
    error,
  };
}

/**
 * Creates an async generator that yields the provided extraction results.
 */
async function* asyncYields(
  values: LeagueExtractionYield[],
): AsyncGenerator<LeagueExtractionYield> {
  for (const value of values) {
    yield value;
  }
}

/**
 * Creates an async generator that yields values then throws an error.
 */
async function* asyncYieldsThenThrow(
  values: LeagueExtractionYield[],
  error: Error,
): AsyncGenerator<LeagueExtractionYield> {
  for (const value of values) {
    yield value;
  }
  throw error;
}

function buildTransformResult(): SingleLeagueTransformResult {
  return {
    profitTable: [],
    currency: [new CurrencyItem({ currencyTypeName: 'Chaos Orb', chaosEquivalent: 1 })],
  };
}

function makeExtractAdapter(yields: LeagueExtractionYield[]): jest.Mocked<IExtractAdapter> {
  return { extract: jest.fn().mockReturnValue(asyncYields(yields)) };
}

function makeTransformAdapter(
  result?: SingleLeagueTransformResult,
): jest.Mocked<ITransformAdapter> {
  const defaultResult = result ?? buildTransformResult();
  return { transform: jest.fn().mockReturnValue(defaultResult) };
}

function makeLoadAdapter(): jest.Mocked<ILoadAdapter> {
  return { load: jest.fn() };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('App.execute', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('success path', () => {
    it('should return correct processed and failed counts on full success', async () => {
      const leagueA = buildLeague('Settlers');
      const leagueB = buildLeague('Standard');

      const extractAdapter = makeExtractAdapter([
        buildExtractionYield(leagueA),
        buildExtractionYield(leagueB),
      ]);
      const transformAdapter = makeTransformAdapter();
      const loadAdapter = makeLoadAdapter();

      const app = new App(extractAdapter, transformAdapter, loadAdapter, silentLogger);
      const result = await app.execute();

      expect(result.processed).toBe(2);
      expect(result.failed).toBe(0);
    });

    it('should call transform and load once per successfully extracted league', async () => {
      const league = buildLeague();
      const extractAdapter = makeExtractAdapter([buildExtractionYield(league)]);
      const transformAdapter = makeTransformAdapter();
      const loadAdapter = makeLoadAdapter();

      const app = new App(extractAdapter, transformAdapter, loadAdapter, silentLogger);
      await app.execute();

      expect(transformAdapter.transform).toHaveBeenCalledTimes(1);
      expect(loadAdapter.load).toHaveBeenCalledTimes(1);
    });
  });

  describe('extraction failures', () => {
    it('should count extraction errors from yielded error results', async () => {
      const leagueA = buildLeague('Settlers');
      const leagueB = buildLeague('Standard');

      const extractAdapter = makeExtractAdapter([
        buildExtractionYield(leagueA),
        buildErrorYield(leagueB, new Error('Fetch failed')),
      ]);
      const transformAdapter = makeTransformAdapter();
      const loadAdapter = makeLoadAdapter();

      const app = new App(extractAdapter, transformAdapter, loadAdapter, silentLogger);
      const result = await app.execute();

      expect(result.processed).toBe(1);
      expect(result.failed).toBe(1);
    });

    it('should not call transform or load for failed extractions', async () => {
      const league = buildLeague();
      const extractAdapter = makeExtractAdapter([
        buildErrorYield(league, new Error('Network timeout')),
      ]);
      const transformAdapter = makeTransformAdapter();
      const loadAdapter = makeLoadAdapter();

      const app = new App(extractAdapter, transformAdapter, loadAdapter, silentLogger);
      await app.execute();

      expect(transformAdapter.transform).not.toHaveBeenCalled();
      expect(loadAdapter.load).not.toHaveBeenCalled();
    });
  });

  describe('transform/load failures', () => {
    it('should count errors from transform failures', async () => {
      const league = buildLeague();
      const extractAdapter = makeExtractAdapter([buildExtractionYield(league)]);
      const transformAdapter: jest.Mocked<ITransformAdapter> = {
        transform: jest.fn().mockImplementation(() => { throw new Error('Transform error'); }),
      };
      const loadAdapter = makeLoadAdapter();

      const app = new App(extractAdapter, transformAdapter, loadAdapter, silentLogger);
      const result = await app.execute();

      expect(result.processed).toBe(0);
      expect(result.failed).toBe(1);
    });

    it('should count errors from load failures', async () => {
      const league = buildLeague();
      const extractAdapter = makeExtractAdapter([buildExtractionYield(league)]);
      const transformAdapter = makeTransformAdapter();
      const loadAdapter: jest.Mocked<ILoadAdapter> = {
        load: jest.fn().mockImplementation(() => { throw new Error('Load error'); }),
      };

      const app = new App(extractAdapter, transformAdapter, loadAdapter, silentLogger);
      const result = await app.execute();

      expect(result.processed).toBe(0);
      expect(result.failed).toBe(1);
    });
  });

  describe('resilience', () => {
    it('should continue processing after one league fails', async () => {
      const leagueA = buildLeague('Settlers');
      const leagueB = buildLeague('Standard');
      const leagueC = buildLeague('Hardcore Settlers');

      const transformAdapter: jest.Mocked<ITransformAdapter> = {
        transform: jest.fn()
          .mockReturnValueOnce(buildTransformResult())
          .mockImplementationOnce(() => { throw new Error('Boom'); })
          .mockReturnValueOnce(buildTransformResult()),
      };

      const extractAdapter = makeExtractAdapter([
        buildExtractionYield(leagueA),
        buildExtractionYield(leagueB),
        buildExtractionYield(leagueC),
      ]);
      const loadAdapter = makeLoadAdapter();

      const app = new App(extractAdapter, transformAdapter, loadAdapter, silentLogger);
      const result = await app.execute();

      expect(result.processed).toBe(2);
      expect(result.failed).toBe(1);
    });
  });

  describe('all failures', () => {
    it('should return { processed: 0, failed: N } when all leagues fail', async () => {
      const leagues = [buildLeague('Settlers'), buildLeague('Standard'), buildLeague('Hardcore')];
      const extractAdapter = makeExtractAdapter(
        leagues.map((league) => buildErrorYield(league, new Error('All down'))),
      );
      const transformAdapter = makeTransformAdapter();
      const loadAdapter = makeLoadAdapter();

      const app = new App(extractAdapter, transformAdapter, loadAdapter, silentLogger);
      const result = await app.execute();

      expect(result.processed).toBe(0);
      expect(result.failed).toBe(3);
    });
  });

  describe('generator-level errors', () => {
    it('should propagate (rethrow) errors thrown by the extract generator itself', async () => {
      const generatorError = new Error('Generator exploded');
      const extractAdapter: jest.Mocked<IExtractAdapter> = {
        extract: jest.fn().mockReturnValue(
          asyncYieldsThenThrow([], generatorError),
        ),
      };
      const transformAdapter = makeTransformAdapter();
      const loadAdapter = makeLoadAdapter();

      const app = new App(extractAdapter, transformAdapter, loadAdapter, silentLogger);

      await expect(app.execute()).rejects.toThrow('Generator exploded');
    });

    it('should propagate generator error even when some leagues succeeded before the throw', async () => {
      const successLeague = buildLeague('Settlers');
      const generatorError = new Error('Mid-stream failure');

      const extractAdapter: jest.Mocked<IExtractAdapter> = {
        extract: jest.fn().mockReturnValue(
          asyncYieldsThenThrow([buildExtractionYield(successLeague)], generatorError),
        ),
      };
      const transformAdapter = makeTransformAdapter();
      const loadAdapter = makeLoadAdapter();

      const app = new App(extractAdapter, transformAdapter, loadAdapter, silentLogger);

      await expect(app.execute()).rejects.toThrow('Mid-stream failure');
    });
  });
});
