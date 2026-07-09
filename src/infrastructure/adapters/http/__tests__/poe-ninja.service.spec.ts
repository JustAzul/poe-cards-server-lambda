import { PoeNinjaService } from '@infrastructure/adapters/http/poe-ninja.service';
import { HttpClient } from '@infrastructure/adapters/http/http-client';
import { ItemOverview } from '@domain/value-objects/item-overview';
import {
  PoeNinjaItemLine,
  ItemOverviewApiResponse,
} from '@infrastructure/types/poe-ninja.types';

function makeMockClient(): jest.Mocked<Pick<HttpClient, 'get'>> {
  return { get: jest.fn() };
}

function makeMockLogger() {
  return {
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };
}

function makeItemLine(overrides: Partial<PoeNinjaItemLine> = {}): PoeNinjaItemLine {
  return {
    name: 'Headhunter',
    itemClass: 9,
    chaosValue: 8000,
    corrupted: false,
    links: 6,
    gemLevel: undefined,
    count: 42,
    stackSize: 1,
    artFilename: 'Headhunter.art',
    flavourText: 'Some lore text',
    explicitModifiers: [{ text: 'Adds modifier', optional: false }],
    ...overrides,
  };
}

describe('PoeNinjaService', () => {
  let client: jest.Mocked<Pick<HttpClient, 'get'>>;
  let logger: ReturnType<typeof makeMockLogger>;
  let service: PoeNinjaService;

  beforeEach(() => {
    client = makeMockClient();
    logger = makeMockLogger();
    service = new PoeNinjaService(
      client as unknown as HttpClient,
      logger,
    );
  });

  describe('fetchItemOverview', () => {
    it('returns ItemOverview[] with only domain fields from a valid response', async () => {
      const line = makeItemLine();
      client.get.mockResolvedValue({ lines: [line] } satisfies ItemOverviewApiResponse);

      const result = await service.fetchItemOverview('Settlers', 'UniqueWeapon');

      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(ItemOverview);
      expect(result[0].name).toBe('Headhunter');
      expect(result[0].itemClass).toBe(9);
      expect(result[0].chaosValue).toBe(8000);
      expect(result[0].corrupted).toBe(false);
      expect(result[0].links).toBe(6);
      expect(result[0].count).toBe(42);
      expect(result[0].stackSize).toBe(1);
    });

    it('does not expose infrastructure-only fields (artFilename, flavourText, explicitModifiers)', async () => {
      const line = makeItemLine();
      client.get.mockResolvedValue({ lines: [line] } satisfies ItemOverviewApiResponse);

      const result = await service.fetchItemOverview('Settlers', 'UniqueWeapon');

      expect(result[0]).not.toHaveProperty('artFilename');
      expect(result[0]).not.toHaveProperty('flavourText');
      expect(result[0]).not.toHaveProperty('explicitModifiers');
    });
  });

  describe('fetchRawItemLines', () => {
    it('returns filtered PoeNinjaItemLine[] from a valid response', async () => {
      const lines = [makeItemLine({ name: 'Atziri\'s Acuity' }), makeItemLine({ name: 'Shavs' })];
      client.get.mockResolvedValue({ lines } satisfies ItemOverviewApiResponse);

      const result = await service.fetchRawItemLines('Settlers', 'UniqueArmour');

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Atziri\'s Acuity');
      expect(result[1].name).toBe('Shavs');
    });

    it('returns [] and logs a warning when response has no lines array', async () => {
      client.get.mockResolvedValue({} as ItemOverviewApiResponse);

      const result = await service.fetchRawItemLines('Settlers', 'UniqueWeapon');

      expect(result).toEqual([]);
      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('missing \'lines\' array'),
      );
    });

    it('returns [] when lines is null', async () => {
      client.get.mockResolvedValue({ lines: null } as unknown as ItemOverviewApiResponse);

      const result = await service.fetchRawItemLines('Settlers', 'UniqueWeapon');

      expect(result).toEqual([]);
      expect(logger.warn).toHaveBeenCalled();
    });

    it('filters out entries that are missing a name', async () => {
      const validLine = makeItemLine({ name: 'Shavs' });
      const noNameLine = makeItemLine({ name: undefined as unknown as string });
      const response: ItemOverviewApiResponse = { lines: [validLine, noNameLine] };
      client.get.mockResolvedValue(response);

      const result = await service.fetchRawItemLines('Settlers', 'UniqueArmour');

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Shavs');
    });

    it('filters out entries with a NaN chaosValue', async () => {
      const validLine = makeItemLine({ name: 'Shavs', chaosValue: 500 });
      const nanLine = makeItemLine({ name: 'Corrupted Item', chaosValue: NaN });
      const response: ItemOverviewApiResponse = { lines: [validLine, nanLine] };
      client.get.mockResolvedValue(response);

      const result = await service.fetchRawItemLines('Settlers', 'UniqueArmour');

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Shavs');
    });

    it('passes correct URL, league, type, and language params to the HTTP client', async () => {
      client.get.mockResolvedValue({ lines: [] } satisfies ItemOverviewApiResponse);

      await service.fetchRawItemLines('Settlers', 'DivinationCard');

      expect(client.get).toHaveBeenCalledWith(
        'https://poe.ninja/poe1/api/economy/stash/current/item/overview',
        { league: 'Settlers', type: 'DivinationCard', language: 'en' },
      );
    });
  });
});
