import { readFileSync } from 'fs';
import { join } from 'path';
import { PoeNinjaCurrencyExchangeService } from '@infrastructure/adapters/http/poe-ninja-currency-exchange.service';
import { HttpClient } from '@infrastructure/adapters/http/http-client';
import { PoeNinjaExchangeResponse } from '@infrastructure/types/poe-ninja-exchange.types';

const CURRENCY_FIXTURE: PoeNinjaExchangeResponse = JSON.parse(
  readFileSync(join(__dirname, '__fixtures__', 'exchange-currency-mirage.json'), 'utf-8'),
);

function makeMockClient(): jest.Mocked<Pick<HttpClient, 'get'>> {
  return { get: jest.fn() };
}

function makeMockLogger() {
  return { log: jest.fn(), warn: jest.fn(), error: jest.fn() };
}

describe('PoeNinjaCurrencyExchangeService', () => {
  let client: jest.Mocked<Pick<HttpClient, 'get'>>;
  let logger: ReturnType<typeof makeMockLogger>;
  let service: PoeNinjaCurrencyExchangeService;

  beforeEach(() => {
    client = makeMockClient();
    logger = makeMockLogger();
    service = new PoeNinjaCurrencyExchangeService(client as unknown as HttpClient, logger);
  });

  it('should query the exchange endpoint for Currency of the given league', async () => {
    client.get.mockResolvedValue(CURRENCY_FIXTURE);

    await service.fetchCurrencyPrices('Mirage');

    expect(client.get).toHaveBeenCalledWith(
      'https://poe.ninja/poe1/api/economy/exchange/current/overview',
      expect.objectContaining({ league: 'Mirage', type: 'Currency' }),
    );
  });

  it('should map each line to a CurrencyItem with chaosEquivalent = primaryValue and volume', async () => {
    client.get.mockResolvedValue(CURRENCY_FIXTURE);

    const prices = await service.fetchCurrencyPrices('Mirage');
    const annul = prices.find((c) => c.currencyTypeName === 'Orb of Annulment');

    expect(annul?.chaosEquivalent).toBe(46.57);
    expect(annul?.getVolume()).toBe(20794);
  });

  it('should carry the Chaos Orb baseline as a real line (chaosEquivalent 1)', async () => {
    client.get.mockResolvedValue(CURRENCY_FIXTURE);

    const prices = await service.fetchCurrencyPrices('Mirage');
    const chaos = prices.find((c) => c.isChaosOrb());

    expect(chaos).toBeDefined();
    expect(chaos?.chaosEquivalent).toBe(1);
  });

  it('should return one CurrencyItem per fixture line', async () => {
    client.get.mockResolvedValue(CURRENCY_FIXTURE);

    const prices = await service.fetchCurrencyPrices('Mirage');

    expect(prices).toHaveLength(CURRENCY_FIXTURE.lines.length);
  });

  it('should degrade to empty with a warn on malformed shape (missing lines)', async () => {
    client.get.mockResolvedValue({ core: { primary: 'chaos' }, items: [] } as unknown as PoeNinjaExchangeResponse);

    const prices = await service.fetchCurrencyPrices('Mirage');

    expect(prices).toEqual([]);
    expect(logger.warn).toHaveBeenCalled();
  });

  it('should convert to chaos when the base is divine with a chaos rate', async () => {
    client.get.mockResolvedValue({
      core: { primary: 'divine', secondary: 'chaos', rates: { chaos: 542.5 } },
      items: [{ id: 'annul', name: 'Orb of Annulment' }],
      lines: [{ id: 'annul', primaryValue: 0.1, volumePrimaryValue: 100 }],
    } as PoeNinjaExchangeResponse);

    const [annul] = await service.fetchCurrencyPrices('Mirage');

    expect(annul.chaosEquivalent).toBeCloseTo(54.25); // 0.1 divine * 542.5
    expect(annul.getVolume()).toBeCloseTo(54250); // 100 divine * 542.5, not raw 100
  });

  it('should propagate network errors (does not swallow to empty)', async () => {
    client.get.mockRejectedValue(new Error('GET exchange failed with status 500'));

    await expect(service.fetchCurrencyPrices('Mirage')).rejects.toThrow(/500/);
  });
});
