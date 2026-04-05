import { League } from '@domain/entities/league.entity';
import { CurrencyItem } from '@domain/value-objects/currency-item';
import { ProfitTableRowDto } from '@infrastructure/dtos/profit-table-row.dto';
import { LoadAdapter } from '@infrastructure/adapters/etl/load.adapter';
import { ItemClass } from '@domain/value-objects/item-class.enum';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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

function buildProfitRow(overrides: Partial<ProfitTableRowDto> = {}): ProfitTableRowDto {
  return {
    card: {
      name: 'The Doctor',
      stack: 8,
      chaosPrice: 500,
      details: {
        artFilename: '',
        rewardName: 'Headhunter',
        rewardClass: ItemClass.UNIQUE,
        isCorrupted: false,
        flavour: '',
      },
    },
    reward: { name: 'Headhunter', chaosPrice: 5000 },
    setChaosPrice: 4000,
    chaosProfit: 1000,
    isCurrency: false,
    ...overrides,
  };
}

function makeLogger() {
  return {
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('LoadAdapter.load', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('logging league info', () => {
    it('should log the league name', () => {
      const logger = makeLogger();
      const adapter = new LoadAdapter(logger);
      const league = buildLeague({ name: 'Settlers' });

      adapter.load(league, [buildProfitRow()], [], '2025-01-01T00:00:00.000Z');

      expect(logger.log).toHaveBeenCalledWith(expect.stringContaining('Settlers'));
    });

    it('should log the timestamp', () => {
      const logger = makeLogger();
      const adapter = new LoadAdapter(logger);
      const league = buildLeague();
      const timestamp = '2025-06-15T12:00:00.000Z';

      adapter.load(league, [], [], timestamp);

      expect(logger.log).toHaveBeenCalledWith(expect.stringContaining(timestamp));
    });

    it('should log profit table entry count', () => {
      const logger = makeLogger();
      const adapter = new LoadAdapter(logger);
      const league = buildLeague();
      const profitTable = [buildProfitRow(), buildProfitRow({ card: { ...buildProfitRow().card, name: 'The Hoarder' } })];

      adapter.load(league, profitTable, [], '2025-01-01T00:00:00.000Z');

      const logCalls = logger.log.mock.calls.map((c: unknown[]) => String(c[0]));
      const countLog = logCalls.find((msg) => msg.includes('2'));
      expect(countLog).toBeDefined();
    });

    it('should log currency item count', () => {
      const logger = makeLogger();
      const adapter = new LoadAdapter(logger);
      const league = buildLeague();
      const currency = [
        new CurrencyItem({ currencyTypeName: 'Chaos Orb', chaosEquivalent: 1 }),
        new CurrencyItem({ currencyTypeName: 'Divine Orb', chaosEquivalent: 200 }),
        new CurrencyItem({ currencyTypeName: 'Exalted Orb', chaosEquivalent: 300 }),
      ];

      adapter.load(league, [], currency, '2025-01-01T00:00:00.000Z');

      const logCalls = logger.log.mock.calls.map((c: unknown[]) => String(c[0]));
      const countLog = logCalls.find((msg) => msg.includes('3'));
      expect(countLog).toBeDefined();
    });
  });

  describe('empty data', () => {
    it('should handle empty profitTable and currency arrays without throwing', () => {
      const logger = makeLogger();
      const adapter = new LoadAdapter(logger);
      const league = buildLeague();

      expect(() => {
        adapter.load(league, [], [], '2025-01-01T00:00:00.000Z');
      }).not.toThrow();
    });

    it('should log 0 entries when profitTable is empty', () => {
      const logger = makeLogger();
      const adapter = new LoadAdapter(logger);
      const league = buildLeague();

      adapter.load(league, [], [], '2025-01-01T00:00:00.000Z');

      const logCalls = logger.log.mock.calls.map((c: unknown[]) => String(c[0]));
      const zeroLog = logCalls.find((msg) => msg.includes('0'));
      expect(zeroLog).toBeDefined();
    });
  });
});
