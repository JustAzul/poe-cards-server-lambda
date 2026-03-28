import { League } from '@domain/entities/league.entity';
import { ItemOverview } from '@domain/value-objects/item-overview';
import { CurrencyItem } from '@domain/value-objects/currency-item';
import { DivinationCard } from '@domain/entities/card.entity';
import { ItemClass } from '@domain/value-objects/item-class.enum';
import { createCurrencyRewardSpec } from '@domain/value-objects/reward-spec';
import { ILeagueRepository } from '@domain/repositories/league.repository';
import { RewardParserService, DivinationCardLine } from '@domain/services/reward-parser.service';
import { LeagueAdapter } from '@infrastructure/adapters/league.adapter';
import { PoeNinjaItemMeta } from '@infrastructure/types/poe-ninja-item-meta';
import { EnrichedLeagueDataYield } from '@infrastructure/types/enriched-league-data';
import { ExtractAdapter } from '@infrastructure/adapters/etl/extract.adapter';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const silentLogger = {
  // eslint-disable-next-line no-empty-function
  log: () => {},
  // eslint-disable-next-line no-empty-function
  warn: () => {},
  // eslint-disable-next-line no-empty-function
  error: () => {},
};

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

function buildCard(name: string): DivinationCard {
  return new DivinationCard(name, 'Chaos Orb', createCurrencyRewardSpec(1));
}

function buildItem(name: string): ItemOverview {
  return new ItemOverview({
    name,
    itemClass: ItemClass.UNIQUE,
    chaosValue: 100,
    count: 20,
  });
}

function buildCurrency(name: string): CurrencyItem {
  return new CurrencyItem({ currencyTypeName: name, chaosEquivalent: 1 });
}

function buildEnrichedYield(
  league: League,
  overrides: Partial<EnrichedLeagueDataYield> = {},
): EnrichedLeagueDataYield {
  return {
    league,
    items: [],
    currency: [],
    timestamp: '2025-01-01T00:00:00.000Z',
    cardLines: [],
    itemMeta: new Map<string, PoeNinjaItemMeta>(),
    ...overrides,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function collectYields(adapter: ExtractAdapter): Promise<any[]> {
  const results: unknown[] = [];
  for await (const result of adapter.extract()) {
    results.push(result);
  }
  return results;
}

// ---------------------------------------------------------------------------
// Factory for mocks
// ---------------------------------------------------------------------------

function makeLeagueRepository(leagues: League[]): jest.Mocked<ILeagueRepository> {
  return { getAllLeagues: jest.fn().mockResolvedValue(leagues) };
}

function makeRewardParser(
  cards: DivinationCard[] = [],
): jest.Mocked<Pick<RewardParserService, 'parseAll'>> {
  return { parseAll: jest.fn().mockReturnValue(cards) };
}

/**
 * Wrap an array of EnrichedLeagueDataYield values as an async generator
 * to simulate LeagueAdapter.fetchBatchLeagueOverview.
 */
async function* asyncYields(
  values: EnrichedLeagueDataYield[],
): AsyncGenerator<EnrichedLeagueDataYield> {
  for (const value of values) {
    yield value;
  }
}

function makeLeagueAdapter(yields: EnrichedLeagueDataYield[]): Pick<LeagueAdapter, 'fetchBatchLeagueOverview'> {
  return {
    fetchBatchLeagueOverview: jest.fn().mockReturnValue(asyncYields(yields)),
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ExtractAdapter.extract', () => {
  describe('happy path', () => {
    it('should yield one extraction result per eligible league with parsed cards', async () => {
      const leagueA = buildLeague({ name: 'Settlers' });
      const leagueB = buildLeague({ name: 'Standard' });

      const cardA = buildCard('The Doctor');
      const cardB = buildCard('The Hoarder');

      const cardLinesA: DivinationCardLine[] = [{ name: 'The Doctor' }];
      const cardLinesB: DivinationCardLine[] = [{ name: 'The Hoarder' }];

      const enrichedA = buildEnrichedYield(leagueA, {
        items: [buildItem('Headhunter')],
        currency: [buildCurrency('Chaos Orb')],
        cardLines: cardLinesA,
        timestamp: '2025-01-01T00:00:00.000Z',
      });
      const enrichedB = buildEnrichedYield(leagueB, {
        items: [],
        currency: [],
        cardLines: cardLinesB,
        timestamp: '2025-01-02T00:00:00.000Z',
      });

      const leagueRepository = makeLeagueRepository([leagueA, leagueB]);
      const rewardParser = makeRewardParser();
      (rewardParser.parseAll as jest.Mock)
        .mockReturnValueOnce([cardA])
        .mockReturnValueOnce([cardB]);
      const leagueAdapter = makeLeagueAdapter([enrichedA, enrichedB]);

      const adapter = new ExtractAdapter(
        leagueRepository,
        rewardParser as unknown as RewardParserService,
        leagueAdapter as unknown as LeagueAdapter,
        silentLogger,
      );

      const results = await collectYields(adapter);

      expect(results).toHaveLength(2);

      expect(results[0].league).toBe(leagueA);
      expect(results[0].error).toBeUndefined();
      expect(results[0].data.cards).toEqual([cardA]);
      expect(results[0].data.items).toEqual([buildItem('Headhunter')]);

      expect(results[1].league).toBe(leagueB);
      expect(results[1].data.cards).toEqual([cardB]);
    });
  });

  describe('league filtering', () => {
    it('should only pass eligible leagues to the adapter', async () => {
      const eligible = buildLeague({ name: 'Settlers' });
      const ssf = buildLeague({ name: 'Settlers SSF', ruleIds: ['NoParties'] });
      const consoleLeague = buildLeague({ name: 'Settlers', realm: 'sony' });
      const hardcore = buildLeague({ name: 'Hardcore' });
      const noStart = buildLeague({ name: 'Beta', startAt: null });

      const leagueRepository = makeLeagueRepository(
        [eligible, ssf, consoleLeague, hardcore, noStart],
      );
      const rewardParser = makeRewardParser([buildCard('The Doctor')]);
      const leagueAdapter = makeLeagueAdapter([buildEnrichedYield(eligible)]);

      const adapter = new ExtractAdapter(
        leagueRepository,
        rewardParser as unknown as RewardParserService,
        leagueAdapter as unknown as LeagueAdapter,
        silentLogger,
      );

      await collectYields(adapter);

      expect(leagueAdapter.fetchBatchLeagueOverview).toHaveBeenCalledWith([eligible]);
    });
  });

  describe('error handling', () => {
    it('should yield an error result with empty data arrays when the adapter yields an error', async () => {
      const league = buildLeague({ name: 'Settlers' });
      const fetchError = new Error('Network timeout');

      const errorYield: EnrichedLeagueDataYield = {
        league,
        items: [],
        currency: [],
        timestamp: '',
        cardLines: [],
        itemMeta: new Map(),
        error: fetchError,
      };

      const leagueRepository = makeLeagueRepository([league]);
      const rewardParser = makeRewardParser();
      const leagueAdapter = makeLeagueAdapter([errorYield]);

      const adapter = new ExtractAdapter(
        leagueRepository,
        rewardParser as unknown as RewardParserService,
        leagueAdapter as unknown as LeagueAdapter,
        silentLogger,
      );

      const results = await collectYields(adapter);

      expect(results).toHaveLength(1);
      expect(results[0].league).toBe(league);
      expect(results[0].error).toBe(fetchError);
      expect(results[0].data.items).toEqual([]);
      expect(results[0].data.currency).toEqual([]);
      expect(results[0].data.cards).toEqual([]);
      expect(results[0].data.itemMeta).toEqual(new Map());
      expect(results[0].data.timestamp).toBe('');
    });

    it('should not call rewardParser when the adapter yields an error', async () => {
      const league = buildLeague({ name: 'Settlers' });

      const errorYield: EnrichedLeagueDataYield = {
        league,
        items: [],
        currency: [],
        timestamp: '',
        cardLines: [],
        itemMeta: new Map(),
        error: new Error('Upstream failure'),
      };

      const leagueRepository = makeLeagueRepository([league]);
      const rewardParser = makeRewardParser();
      const leagueAdapter = makeLeagueAdapter([errorYield]);

      const adapter = new ExtractAdapter(
        leagueRepository,
        rewardParser as unknown as RewardParserService,
        leagueAdapter as unknown as LeagueAdapter,
        silentLogger,
      );

      await collectYields(adapter);

      expect(rewardParser.parseAll).not.toHaveBeenCalled();
    });
  });

  describe('empty leagues', () => {
    it('should complete without yielding when repository returns no leagues', async () => {
      const leagueRepository = makeLeagueRepository([]);
      const rewardParser = makeRewardParser();
      const leagueAdapter = makeLeagueAdapter([]);

      const adapter = new ExtractAdapter(
        leagueRepository,
        rewardParser as unknown as RewardParserService,
        leagueAdapter as unknown as LeagueAdapter,
        silentLogger,
      );

      const results = await collectYields(adapter);

      expect(results).toHaveLength(0);
    });
  });

  describe('rewardParser invocation', () => {
    it('should call rewardParser.parseAll with cardLines from the enriched yield', async () => {
      const league = buildLeague({ name: 'Settlers' });
      const cardLines: DivinationCardLine[] = [
        { name: 'The Doctor', explicitModifiers: [{ text: '<uniqueitem>{Headhunter}', optional: false }] },
        { name: 'The Hoarder', explicitModifiers: [{ text: '<currencyitem>{Exalted Orb}', optional: false }] },
      ];
      const itemMeta = new Map<string, PoeNinjaItemMeta>([
        ['The Doctor', { artFilename: 'art.png', flavourText: 'heal' }],
      ]);

      const enriched = buildEnrichedYield(league, {
        items: [buildItem('Headhunter'), buildItem('AnotherItem')],
        cardLines,
        itemMeta,
      });

      const leagueRepository = makeLeagueRepository([league]);
      const rewardParser = makeRewardParser([buildCard('The Doctor')]);
      const leagueAdapter = makeLeagueAdapter([enriched]);

      const adapter = new ExtractAdapter(
        leagueRepository,
        rewardParser as unknown as RewardParserService,
        leagueAdapter as unknown as LeagueAdapter,
        silentLogger,
      );

      await collectYields(adapter);

      // Must be called with cardLines, not items filtered by itemClass
      expect(rewardParser.parseAll).toHaveBeenCalledTimes(1);
      expect(rewardParser.parseAll).toHaveBeenCalledWith(cardLines);
    });

    it('should pass itemMeta and timestamp through to the yield unchanged', async () => {
      const league = buildLeague({ name: 'Settlers' });
      const itemMeta = new Map<string, PoeNinjaItemMeta>([
        ['The Doctor', { artFilename: 'doctor.png', flavourText: 'rich' }],
      ]);
      const timestamp = '2025-06-15T12:00:00.000Z';

      const enriched = buildEnrichedYield(league, { itemMeta, timestamp });

      const leagueRepository = makeLeagueRepository([league]);
      const rewardParser = makeRewardParser([]);
      const leagueAdapter = makeLeagueAdapter([enriched]);

      const adapter = new ExtractAdapter(
        leagueRepository,
        rewardParser as unknown as RewardParserService,
        leagueAdapter as unknown as LeagueAdapter,
        silentLogger,
      );

      const results = await collectYields(adapter);

      expect(results[0].data.itemMeta).toBe(itemMeta);
      expect(results[0].data.timestamp).toBe(timestamp);
    });
  });
});
