import { readFileSync } from 'fs';
import { join } from 'path';
import { PoeAtlasService } from '@infrastructure/adapters/http/poe-atlas.service';
import { HttpClient } from '@infrastructure/adapters/http/http-client';
import { PoeAtlasCardDetail } from '@infrastructure/types/poeatlas.types';

const POEATLAS_FIXTURE: PoeAtlasCardDetail[] = JSON.parse(
  readFileSync(join(__dirname, '__fixtures__', 'poeatlas-card-details.json'), 'utf-8'),
);

function makeMockClient(): jest.Mocked<Pick<HttpClient, 'get'>> {
  return { get: jest.fn() };
}

function makeMockLogger() {
  return { log: jest.fn(), warn: jest.fn(), error: jest.fn() };
}

describe('PoeAtlasService', () => {
  let client: jest.Mocked<Pick<HttpClient, 'get'>>;
  let logger: ReturnType<typeof makeMockLogger>;
  let service: PoeAtlasService;

  beforeEach(() => {
    client = makeMockClient();
    logger = makeMockLogger();
    service = new PoeAtlasService(client as unknown as HttpClient, logger);
  });

  it('should fetch the bulk divinationCardDetails endpoint once', async () => {
    client.get.mockResolvedValue(POEATLAS_FIXTURE);

    await service.fetchDefinitions();

    expect(client.get).toHaveBeenCalledTimes(1);
    expect(client.get).toHaveBeenCalledWith('https://data.poeatlas.app/divinationCardDetails.json');
  });

  it('should build a slug-keyed definition with card line, metadata and stackSize', async () => {
    client.get.mockResolvedValue(POEATLAS_FIXTURE);

    const defs = await service.fetchDefinitions();
    const nurse = defs.get('the-nurse');

    expect(nurse).toEqual({
      name: 'The Nurse',
      explicitModifiers: [{ text: '<divination>{The Doctor}', optional: false }],
      artFilename: 'TheNurse',
      flavourText: 'We tried to tell him to get his head checked.',
      stackSize: 8,
    });
  });

  it('should skip entries with a null slug (e.g. gamble cards) and warn', async () => {
    client.get.mockResolvedValue(POEATLAS_FIXTURE);

    const defs = await service.fetchDefinitions();
    const names = [...defs.values()].map((d) => d.name);

    expect(names).not.toContain("Anarchy's Price");
    expect(defs.size).toBe(9);
    expect(logger.warn).toHaveBeenCalled();
  });

  it('should keep unsupported-reward-tag entries (the parser skips them downstream)', async () => {
    client.get.mockResolvedValue(POEATLAS_FIXTURE);

    const defs = await service.fetchDefinitions();

    // bowyers-dream is a <whiteitem> reward — kept here, skipped by the parser later
    expect(defs.has('bowyers-dream')).toBe(true);
  });

  it('should drop malformed explicitModifiers (non-array / missing text) to undefined without throwing', async () => {
    client.get.mockResolvedValue([
      {
        name: 'Bad Array', detailsId: 'bad-array', stackSize: 1, explicitModifiers: 'not-an-array',
      },
      {
        name: 'Bad Items', detailsId: 'bad-items', stackSize: 1, explicitModifiers: [{ optional: false }, 42],
      },
    ] as unknown as PoeAtlasCardDetail[]);

    const defs = await service.fetchDefinitions();

    expect(defs.get('bad-array')?.explicitModifiers).toBeUndefined();
    expect(defs.get('bad-items')?.explicitModifiers).toBeUndefined();
    expect(logger.warn).toHaveBeenCalledWith(expect.stringMatching(/malformed explicitModifiers/i));
  });

  it('should treat a non-boolean optional strictly (only real true is optional)', async () => {
    client.get.mockResolvedValue([
      {
        name: 'Stringy Optional',
        detailsId: 'stringy-optional',
        stackSize: 1,
        explicitModifiers: [{ text: '<uniqueitem>{Headhunter}', optional: 'false' }],
      },
    ] as unknown as PoeAtlasCardDetail[]);

    const defs = await service.fetchDefinitions();

    expect(defs.get('stringy-optional')?.explicitModifiers).toEqual([
      { text: '<uniqueitem>{Headhunter}', optional: false },
    ]);
  });

  it('should keep only well-shaped modifier entries and coerce optional to boolean', async () => {
    client.get.mockResolvedValue([
      {
        name: 'Mixed',
        detailsId: 'mixed',
        stackSize: 1,
        explicitModifiers: [{ text: '<uniqueitem>{Headhunter}' }, { notText: 1 }],
      },
    ] as unknown as PoeAtlasCardDetail[]);

    const defs = await service.fetchDefinitions();

    expect(defs.get('mixed')?.explicitModifiers).toEqual([
      { text: '<uniqueitem>{Headhunter}', optional: false },
    ]);
  });

  it('should degrade to an empty map with a warn on malformed (non-array) shape', async () => {
    client.get.mockResolvedValue({ notAnArray: true } as unknown as PoeAtlasCardDetail[]);

    const defs = await service.fetchDefinitions();

    expect(defs.size).toBe(0);
    expect(logger.warn).toHaveBeenCalled();
  });

  it('should propagate network errors (does not swallow to empty)', async () => {
    client.get.mockRejectedValue(new Error('GET divinationCardDetails failed with status 502'));

    await expect(service.fetchDefinitions()).rejects.toThrow(/502/);
  });
});
