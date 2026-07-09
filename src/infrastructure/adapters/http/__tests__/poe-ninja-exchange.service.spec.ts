import { readFileSync } from 'fs';
import { join } from 'path';
import { PoeNinjaExchangeService } from '@infrastructure/adapters/http/poe-ninja-exchange.service';
import { HttpClient } from '@infrastructure/adapters/http/http-client';
import { PoeNinjaExchangeResponse } from '@infrastructure/types/poe-ninja-exchange.types';

const EXCHANGE_FIXTURE: PoeNinjaExchangeResponse = JSON.parse(
  readFileSync(join(__dirname, '__fixtures__', 'exchange-divcards-mirage.json'), 'utf-8'),
);

function makeMockClient(): jest.Mocked<Pick<HttpClient, 'get'>> {
  return { get: jest.fn() };
}

function makeMockLogger() {
  return { log: jest.fn(), warn: jest.fn(), error: jest.fn() };
}

describe('PoeNinjaExchangeService', () => {
  let client: jest.Mocked<Pick<HttpClient, 'get'>>;
  let logger: ReturnType<typeof makeMockLogger>;
  let service: PoeNinjaExchangeService;

  beforeEach(() => {
    client = makeMockClient();
    logger = makeMockLogger();
    service = new PoeNinjaExchangeService(client as unknown as HttpClient, logger);
  });

  it('should query the exchange endpoint for DivinationCard of the given league', async () => {
    client.get.mockResolvedValue(EXCHANGE_FIXTURE);

    await service.fetchPrices('Mirage');

    expect(client.get).toHaveBeenCalledWith(
      'https://poe.ninja/poe1/api/economy/exchange/current/overview',
      expect.objectContaining({ league: 'Mirage', type: 'DivinationCard' }),
    );
  });

  it('should set chaosValue to primaryValue (no rate division) and join name by id', async () => {
    client.get.mockResolvedValue(EXCHANGE_FIXTURE);

    const prices = await service.fetchPrices('Mirage');
    const nurse = prices.find((p) => p.slug === 'the-nurse');

    expect(nurse).toEqual({
      slug: 'the-nurse',
      name: 'The Nurse',
      chaosValue: 82,
      volumePrimaryValue: 205,
    });
  });

  it('should return one price per fixture line', async () => {
    client.get.mockResolvedValue(EXCHANGE_FIXTURE);

    const prices = await service.fetchPrices('Mirage');

    expect(prices).toHaveLength(EXCHANGE_FIXTURE.lines.length);
  });

  it('should treat a line with no volumePrimaryValue as 0', async () => {
    client.get.mockResolvedValue({
      core: { primary: 'chaos' },
      items: [{ id: 'the-doctor', name: 'The Doctor' }],
      lines: [{ id: 'the-doctor', primaryValue: 500 }],
    } as PoeNinjaExchangeResponse);

    const [price] = await service.fetchPrices('Mirage');

    expect(price.volumePrimaryValue).toBe(0);
  });

  it('should skip a line whose id has no matching item', async () => {
    client.get.mockResolvedValue({
      core: { primary: 'chaos' },
      items: [{ id: 'the-doctor', name: 'The Doctor' }],
      lines: [
        { id: 'the-doctor', primaryValue: 500, volumePrimaryValue: 10 },
        { id: 'orphan-line', primaryValue: 5, volumePrimaryValue: 1 },
      ],
    } as PoeNinjaExchangeResponse);

    const prices = await service.fetchPrices('Mirage');

    expect(prices.map((p) => p.slug)).toEqual(['the-doctor']);
  });

  it('should degrade to empty with a warn on malformed shape (missing lines)', async () => {
    client.get.mockResolvedValue({ core: { primary: 'chaos' }, items: [] } as unknown as PoeNinjaExchangeResponse);

    const prices = await service.fetchPrices('Mirage');

    expect(prices).toEqual([]);
    expect(logger.warn).toHaveBeenCalled();
  });

  it('should degrade to empty with a warn when the base is non-chaos and has no chaos rate', async () => {
    client.get.mockResolvedValue({
      core: { primary: 'divine' },
      items: [{ id: 'the-doctor', name: 'The Doctor' }],
      lines: [{ id: 'the-doctor', primaryValue: 1, volumePrimaryValue: 1 }],
    } as PoeNinjaExchangeResponse);

    const prices = await service.fetchPrices('Mirage');

    expect(prices).toEqual([]);
    expect(logger.warn).toHaveBeenCalledWith(expect.stringMatching(/primary/i));
  });

  it('should convert primaryValue to chaos when the base is divine with a chaos rate', async () => {
    client.get.mockResolvedValue({
      core: { primary: 'divine', secondary: 'chaos', rates: { chaos: 542.5 } },
      items: [{ id: 'the-doctor', name: 'The Doctor' }],
      lines: [{ id: 'the-doctor', primaryValue: 2, volumePrimaryValue: 10 }],
    } as PoeNinjaExchangeResponse);

    const [price] = await service.fetchPrices('Mirage');

    expect(price.chaosValue).toBe(1085); // 2 divine * 542.5 chaos/divine
  });

  it('should propagate network errors (does not swallow to empty)', async () => {
    client.get.mockRejectedValue(new Error('GET exchange failed with status 500'));

    await expect(service.fetchPrices('Mirage')).rejects.toThrow(/500/);
  });
});
