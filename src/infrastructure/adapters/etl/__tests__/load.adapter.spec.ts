import { League } from '@domain/entities/league.entity';
import { CurrencyItem } from '@domain/value-objects/currency-item';
import { ProfitTableRowDto } from '@infrastructure/dtos/profit-table-row.dto';
import { LoadAdapter } from '@infrastructure/adapters/etl/load.adapter';
import { ItemClass } from '@domain/value-objects/item-class.enum';

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

function makeStore() {
  return {
    upsertLeaguePayload: jest.fn(),
  };
}

describe('LoadAdapter.load', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('persists league payload into the store', () => {
    const logger = makeLogger();
    const store = makeStore();
    const adapter = new LoadAdapter(store as never, logger);
    const league = buildLeague({ name: 'Settlers' });

    adapter.load(league, [buildProfitRow()], [], '2025-01-01T00:00:00.000Z');

    expect(store.upsertLeaguePayload).toHaveBeenCalledTimes(1);
    expect(store.upsertLeaguePayload).toHaveBeenCalledWith(
      'Settlers',
      expect.objectContaining({
        updatedAt: '2025-01-01T00:00:00.000Z',
        entryCount: 1,
      }),
    );
  });

  it('computes currency rates from known currencies', () => {
    const logger = makeLogger();
    const store = makeStore();
    const adapter = new LoadAdapter(store as never, logger);
    const league = buildLeague();
    const currency = [
      new CurrencyItem({ currencyTypeName: 'Divine Orb', chaosEquivalent: 210 }),
      new CurrencyItem({ currencyTypeName: 'Exalted Orb', chaosEquivalent: 85 }),
      new CurrencyItem({ currencyTypeName: 'Orb of Annulment', chaosEquivalent: 12 }),
      new CurrencyItem({ currencyTypeName: 'Mirror of Kalandra', chaosEquivalent: 120000 }),
    ];

    adapter.load(league, [buildProfitRow()], currency, '2025-01-01T00:00:00.000Z');

    expect(store.upsertLeaguePayload).toHaveBeenCalledWith(
      'Settlers',
      expect.objectContaining({
        currencyRates: {
          divine: 210,
          exalted: 85,
          annul: 12,
          mirror: 120000,
        },
      }),
    );
  });

  it('logs persistence details', () => {
    const logger = makeLogger();
    const store = makeStore();
    const adapter = new LoadAdapter(store as never, logger);
    const league = buildLeague({ name: 'Settlers' });

    adapter.load(league, [buildProfitRow()], [], '2025-01-01T00:00:00.000Z');

    expect(logger.log).toHaveBeenCalledWith(expect.stringContaining('Persisted data for league: Settlers'));
  });

  it('handles empty arrays without throwing', () => {
    const logger = makeLogger();
    const store = makeStore();
    const adapter = new LoadAdapter(store as never, logger);
    const league = buildLeague();

    expect(() => adapter.load(league, [], [], '2025-01-01T00:00:00.000Z')).not.toThrow();
  });
});
