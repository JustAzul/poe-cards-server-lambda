import { PoeNinjaLeagueSource } from '@infrastructure/adapters/http/poe-ninja-league.source';
import { HttpClient } from '@infrastructure/adapters/http/http-client';
import { League } from '@domain/entities/league.entity';
import { PoeNinjaIndexStateResponse } from '@infrastructure/types/poe-ninja-index-state.types';

function makeMockClient(): jest.Mocked<Pick<HttpClient, 'get'>> {
  return { get: jest.fn() };
}

function makeMockLogger() {
  return { log: jest.fn(), warn: jest.fn(), error: jest.fn() };
}

const INDEX_STATE: PoeNinjaIndexStateResponse = {
  economyLeagues: [
    { name: 'Mirage', url: 'mirage', displayName: 'Mirage' },
    { name: 'Hardcore Mirage', url: 'miragehc', displayName: 'Hardcore Mirage' },
    { name: 'Standard', url: 'standard', displayName: 'Standard' },
    { name: 'Hardcore', url: 'hardcore', displayName: 'Hardcore' },
  ],
};

describe('PoeNinjaLeagueSource', () => {
  let client: jest.Mocked<Pick<HttpClient, 'get'>>;
  let logger: ReturnType<typeof makeMockLogger>;
  let source: PoeNinjaLeagueSource;

  beforeEach(() => {
    client = makeMockClient();
    logger = makeMockLogger();
    source = new PoeNinjaLeagueSource(client as unknown as HttpClient, logger);
  });

  it('should fetch the index-state endpoint', async () => {
    client.get.mockResolvedValue(INDEX_STATE);

    await source.getAllLeagues();

    expect(client.get).toHaveBeenCalledWith('https://poe.ninja/poe1/api/data/index-state');
  });

  it('should map every economy league to a League entity with url as ladder identifier', async () => {
    client.get.mockResolvedValue(INDEX_STATE);

    const result = await source.getAllLeagues();

    expect(result).toHaveLength(4);
    expect(result[0]).toBeInstanceOf(League);
    expect(result[0]).toMatchObject({
      name: 'Mirage',
      ladder: 'mirage',
      delveEvent: false,
      realm: 'pc',
      startAt: null,
      endAt: null,
      ruleIds: [],
    });
  });

  it('should return permanent leagues too (name-based exclusion happens downstream)', async () => {
    client.get.mockResolvedValue(INDEX_STATE);

    const names = (await source.getAllLeagues()).map((l) => l.name);

    expect(names).toContain('Standard');
    expect(names).toContain('Hardcore');
  });

  it('should throw when economyLeagues is missing (malformed index-state)', async () => {
    client.get.mockResolvedValue({} as PoeNinjaIndexStateResponse);

    await expect(source.getAllLeagues()).rejects.toThrow(/economyLeagues/);
  });

  it('should drop malformed league entries and warn', async () => {
    client.get.mockResolvedValue({
      economyLeagues: [
        { name: 'Mirage', url: 'mirage' },
        { name: '', url: 'broken' },
        { url: 'no-name' },
      ],
    } as PoeNinjaIndexStateResponse);

    const result = await source.getAllLeagues();

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Mirage');
    expect(logger.warn).toHaveBeenCalled();
  });

  it('should propagate network errors (does not swallow to empty)', async () => {
    client.get.mockRejectedValue(new Error('GET index-state failed with status 503'));

    await expect(source.getAllLeagues()).rejects.toThrow(/503/);
  });
});
