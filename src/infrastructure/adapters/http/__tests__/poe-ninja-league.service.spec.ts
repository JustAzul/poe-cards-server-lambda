import { PoeNinjaLeagueService } from '@infrastructure/adapters/http/poe-ninja-league.service';
import { HttpClient } from '@infrastructure/adapters/http/http-client';
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

describe('PoeNinjaLeagueService', () => {
  let client: jest.Mocked<Pick<HttpClient, 'get'>>;
  let logger: ReturnType<typeof makeMockLogger>;
  let service: PoeNinjaLeagueService;

  beforeEach(() => {
    client = makeMockClient();
    logger = makeMockLogger();
    service = new PoeNinjaLeagueService(client as unknown as HttpClient, logger);
  });

  it('should fetch the index-state endpoint', async () => {
    client.get.mockResolvedValue(INDEX_STATE);

    await service.fetchLeagues();

    expect(client.get).toHaveBeenCalledWith('https://poe.ninja/poe1/api/data/index-state');
  });

  it('should map every economy league to RawLeagueData with url as ladder identifier', async () => {
    client.get.mockResolvedValue(INDEX_STATE);

    const result = await service.fetchLeagues();

    expect(result).toHaveLength(4);
    expect(result[0]).toEqual({
      name: 'Mirage',
      url: 'mirage',
      delveEvent: false,
      realm: 'pc',
      startAt: null,
      endAt: null,
      rules: [],
    });
  });

  it('should return permanent leagues too (name-based exclusion happens downstream)', async () => {
    client.get.mockResolvedValue(INDEX_STATE);

    const names = (await service.fetchLeagues()).map((l) => l.name);

    expect(names).toContain('Standard');
    expect(names).toContain('Hardcore');
  });

  it('should throw when economyLeagues is missing (malformed index-state)', async () => {
    client.get.mockResolvedValue({} as PoeNinjaIndexStateResponse);

    await expect(service.fetchLeagues()).rejects.toThrow(/economyLeagues/);
  });

  it('should drop malformed league entries and warn', async () => {
    client.get.mockResolvedValue({
      economyLeagues: [
        { name: 'Mirage', url: 'mirage' },
        { name: '', url: 'broken' },
        { url: 'no-name' },
      ],
    } as PoeNinjaIndexStateResponse);

    const result = await service.fetchLeagues();

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Mirage');
    expect(logger.warn).toHaveBeenCalled();
  });

  it('should propagate network errors (does not swallow to empty)', async () => {
    client.get.mockRejectedValue(new Error('GET index-state failed with status 503'));

    await expect(service.fetchLeagues()).rejects.toThrow(/503/);
  });
});
