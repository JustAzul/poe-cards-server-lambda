import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { League } from '@domain/entities/league.entity';
import { ProfitTableRowDto } from '@infrastructure/dtos/profit-table-row.dto';
import { R2LoadAdapter } from '@infrastructure/adapters/etl/r2-load.adapter';
import { FanOutService } from '@infrastructure/adapters/etl/fan-out.service';
import { ItemClass } from '@domain/value-objects/item-class.enum';

const BUCKET = 'poe-cards';
const INDEX_KEY = 'index.json';

// Single fixed "now" the whole file's fixtures are expressed relative to — every
// `updatedAt` fixture below is `agoIso(minutes)` against this instant, so the
// index-entry TTL (1 hour) behaves identically in 2026 as it will in any later year.
const FIXED_NOW_ISO = '2026-07-11T20:00:00.000Z';
const FIXED_NOW_MS = Date.parse(FIXED_NOW_ISO);

function agoIso(minutes: number): string {
  return new Date(FIXED_NOW_MS - minutes * 60_000).toISOString();
}

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

interface LeagueIndexEntry {
  name: string;
  ladder: string;
  updatedAt: string;
}

/**
 * Builds a mock S3Client whose GetObjectCommand(index.json) response is controllable:
 * omit `existingIndexEntries` to simulate a fresh bucket (NoSuchKey), or pass an array
 * to simulate an index.json already written by a prior run.
 */
function makeS3Client(existingIndexEntries?: LeagueIndexEntry[]) {
  const send = jest.fn().mockImplementation((command: unknown) => {
    if (command instanceof GetObjectCommand) {
      if (existingIndexEntries === undefined) {
        const notFound = new Error('The specified key does not exist.');
        notFound.name = 'NoSuchKey';
        return Promise.reject(notFound);
      }

      const transformToString = jest.fn().mockResolvedValue(JSON.stringify(existingIndexEntries));
      return Promise.resolve({ Body: { transformToString } });
    }

    return Promise.resolve({});
  });

  return { send } as unknown as jest.Mocked<S3Client>;
}

/** Builds a mock S3Client whose GetObjectCommand(index.json) returns an arbitrary raw body. */
function makeS3ClientWithRawIndexBody(rawBody: string) {
  const transformToString = jest.fn().mockResolvedValue(rawBody);
  const send = jest.fn().mockImplementation((command: unknown) => {
    if (command instanceof GetObjectCommand) {
      return Promise.resolve({ Body: { transformToString } });
    }
    return Promise.resolve({});
  });

  return { send } as unknown as jest.Mocked<S3Client>;
}

/** Builds a mock S3Client whose index GetObject rejects on its first call, then succeeds. */
function makeS3ClientThrowingOnFirstGet(entriesAfterRecovery: LeagueIndexEntry[] = []) {
  let getCallCount = 0;
  const send = jest.fn().mockImplementation((command: unknown) => {
    if (command instanceof GetObjectCommand) {
      getCallCount += 1;
      if (getCallCount === 1) {
        return Promise.reject(new Error('simulated R2 GET failure'));
      }

      const transformToString = jest.fn().mockResolvedValue(JSON.stringify(entriesAfterRecovery));
      return Promise.resolve({ Body: { transformToString } });
    }

    return Promise.resolve({});
  });

  return { send } as unknown as jest.Mocked<S3Client>;
}

/** Builds a mock S3Client whose index PutObject rejects on its first call, then succeeds. */
function makeS3ClientThrowingOnFirstPut(existingIndexEntries: LeagueIndexEntry[] = []) {
  let putCallCount = 0;
  const send = jest.fn().mockImplementation((command: unknown) => {
    if (command instanceof GetObjectCommand) {
      const transformToString = jest.fn().mockResolvedValue(JSON.stringify(existingIndexEntries));
      return Promise.resolve({ Body: { transformToString } });
    }

    if (command instanceof PutObjectCommand && command.input.Key === INDEX_KEY) {
      putCallCount += 1;
      if (putCallCount === 1) {
        return Promise.reject(new Error('simulated R2 PUT failure'));
      }
    }

    return Promise.resolve({});
  });

  return { send } as unknown as jest.Mocked<S3Client>;
}

function makeFanOut() {
  const notifyLeagueUpdated = jest.fn().mockResolvedValue(undefined);
  const notifyIndexUpdated = jest.fn().mockResolvedValue(undefined);
  return { notifyLeagueUpdated, notifyIndexUpdated } as unknown as jest.Mocked<FanOutService>;
}

/** Returns the LAST index.json PutObjectCommand — a throw-then-retry test sends more than one. */
function findIndexPutCall(s3Client: jest.Mocked<S3Client>) {
  const indexPutCalls = s3Client.send.mock.calls.filter(
    ([command]) => command instanceof PutObjectCommand && command.input.Key === INDEX_KEY,
  );
  return indexPutCalls[indexPutCalls.length - 1];
}

describe('R2LoadAdapter', () => {
  beforeAll(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(FIXED_NOW_ISO));
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('writes the league payload to R2 under an encoded key', async () => {
    const s3Client = makeS3Client();
    const logger = makeLogger();
    const fanOut = makeFanOut();
    const adapter = new R2LoadAdapter(s3Client, BUCKET, logger, fanOut);
    const league = buildLeague({ name: 'Hardcore Settlers' });

    await adapter.load(league, [buildProfitRow()], [], agoIso(120));

    expect(s3Client.send).toHaveBeenCalledTimes(1);
    const command = s3Client.send.mock.calls[0][0] as PutObjectCommand;
    expect(command.input.Bucket).toBe(BUCKET);
    expect(command.input.Key).toBe('leagues/Hardcore%20Settlers.json');
    expect(command.input.ContentType).toBe('application/json');

    const body = JSON.parse(command.input.Body as string);
    expect(body.entryCount).toBe(1);
    expect(body.updatedAt).toBe(agoIso(120));
  });

  it('fires the fan-out notification after the R2 write', async () => {
    const s3Client = makeS3Client();
    const logger = makeLogger();
    const fanOut = makeFanOut();
    const adapter = new R2LoadAdapter(s3Client, BUCKET, logger, fanOut);
    const league = buildLeague({ name: 'Settlers' });

    await adapter.load(league, [buildProfitRow()], [], agoIso(120));

    expect(fanOut.notifyLeagueUpdated).toHaveBeenCalledWith('Settlers');
  });

  it('accumulates an index entry per league and writes it on finalize', async () => {
    const s3Client = makeS3Client();
    const logger = makeLogger();
    const fanOut = makeFanOut();
    const adapter = new R2LoadAdapter(s3Client, BUCKET, logger, fanOut);

    await adapter.load(buildLeague({ name: 'Settlers', ladder: 'Settlers' }), [], [], agoIso(10));
    await adapter.load(buildLeague({ name: 'Standard', ladder: 'Standard' }), [], [], agoIso(5));
    await adapter.finalize();

    const indexCall = findIndexPutCall(s3Client);
    expect(indexCall).toBeDefined();

    const indexBody = JSON.parse((indexCall![0] as PutObjectCommand).input.Body as string);
    expect(indexBody).toEqual([
      { name: 'Settlers', ladder: 'Settlers', updatedAt: agoIso(10) },
      { name: 'Standard', ladder: 'Standard', updatedAt: agoIso(5) },
    ]);
    expect(fanOut.notifyIndexUpdated).toHaveBeenCalledTimes(1);
  });

  it('writes an empty index on a cold start (no existing index, nothing loaded this run) without triggering the zero-entry floor', async () => {
    const s3Client = makeS3Client(); // no existing index.json (NoSuchKey)
    const logger = makeLogger();
    const fanOut = makeFanOut();
    const adapter = new R2LoadAdapter(s3Client, BUCKET, logger, fanOut);

    await adapter.finalize();

    const indexCall = findIndexPutCall(s3Client);
    expect(indexCall).toBeDefined();
    expect(logger.error).not.toHaveBeenCalled();

    const indexBody = JSON.parse((indexCall![0] as PutObjectCommand).input.Body as string);
    expect(indexBody).toEqual([]);
    expect(fanOut.notifyIndexUpdated).toHaveBeenCalledTimes(1);
  });

  it('preserves leagues from a prior run that failed this run, instead of overwriting the index', async () => {
    // Simulates a partial-failure run: index.json already lists 3 leagues from a
    // previous successful run (all still within the TTL window), but only 1 of them
    // (plus a brand-new one) succeeds this run. The other 2 previously-known leagues
    // must survive the merge.
    const existingIndexEntries = [
      { name: 'Settlers', ladder: 'Settlers', updatedAt: agoIso(45) },
      { name: 'Hardcore Settlers', ladder: 'Hardcore Settlers', updatedAt: agoIso(45) },
      { name: 'Standard', ladder: 'Standard', updatedAt: agoIso(45) },
    ];
    const s3Client = makeS3Client(existingIndexEntries);
    const logger = makeLogger();
    const fanOut = makeFanOut();
    const adapter = new R2LoadAdapter(s3Client, BUCKET, logger, fanOut);

    // This run: 'Settlers' refreshes successfully, 'New League' is brand new;
    // 'Hardcore Settlers' and 'Standard' failed extraction/transform and never call load().
    await adapter.load(buildLeague({ name: 'Settlers', ladder: 'Settlers' }), [], [], agoIso(5));
    await adapter.load(buildLeague({ name: 'New League', ladder: 'New League' }), [], [], agoIso(5));
    await adapter.finalize();

    const indexCall = findIndexPutCall(s3Client);
    expect(indexCall).toBeDefined();

    const indexBody = JSON.parse((indexCall![0] as PutObjectCommand).input.Body as string);
    expect(indexBody).toEqual([
      { name: 'Settlers', ladder: 'Settlers', updatedAt: agoIso(5) }, // refreshed
      { name: 'Hardcore Settlers', ladder: 'Hardcore Settlers', updatedAt: agoIso(45) }, // preserved
      { name: 'Standard', ladder: 'Standard', updatedAt: agoIso(45) }, // preserved
      { name: 'New League', ladder: 'New League', updatedAt: agoIso(5) }, // added
    ]);
  });

  it('reset() discards accumulated entries so an aborted run never leaks into a later finalize()', async () => {
    // Simulates a generator-level abort: 'Settlers' loaded successfully, then the
    // extract generator itself threw. App.execute() calls reset() on that abort path
    // instead of finalize(). A later invocation (warm Lambda, same adapter instance)
    // must not see 'Settlers' bleed into its finalize() write.
    const existingIndexEntries = [
      { name: 'Standard', ladder: 'Standard', updatedAt: agoIso(20) },
    ];
    const s3Client = makeS3Client(existingIndexEntries);
    const logger = makeLogger();
    const fanOut = makeFanOut();
    const adapter = new R2LoadAdapter(s3Client, BUCKET, logger, fanOut);

    await adapter.load(buildLeague({ name: 'Settlers', ladder: 'Settlers' }), [], [], agoIso(10));
    adapter.reset();

    // Next invocation reuses the same adapter instance and completes normally.
    await adapter.finalize();

    const indexCall = findIndexPutCall(s3Client);
    expect(indexCall).toBeDefined();

    const indexBody = JSON.parse((indexCall![0] as PutObjectCommand).input.Body as string);
    expect(indexBody).toEqual(existingIndexEntries);
  });

  it.each([
    ['a JSON object instead of an array', JSON.stringify({ name: 'Settlers', ladder: 'Settlers', updatedAt: 'x' })],
    ['an array with an entry missing a required field', JSON.stringify([{ name: 'Settlers' }])],
    ['syntactically invalid JSON', '{not json'],
  ])('treats a malformed existing index.json (%s) as empty instead of throwing', async (_case, rawBody) => {
    const s3Client = makeS3ClientWithRawIndexBody(rawBody);
    const logger = makeLogger();
    const fanOut = makeFanOut();
    const adapter = new R2LoadAdapter(s3Client, BUCKET, logger, fanOut);

    await adapter.load(buildLeague({ name: 'New League', ladder: 'New League' }), [], [], agoIso(5));

    await expect(adapter.finalize()).resolves.toBeUndefined();
    expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('index.json'));

    const indexCall = findIndexPutCall(s3Client);
    const indexBody = JSON.parse((indexCall![0] as PutObjectCommand).input.Body as string);
    expect(indexBody).toEqual([
      { name: 'New League', ladder: 'New League', updatedAt: agoIso(5) },
    ]);
  });

  it('drops an index entry whose updatedAt is more than 1 hour old', async () => {
    const existingIndexEntries = [
      { name: 'StaleLeague', ladder: 'StaleLeague', updatedAt: agoIso(90) },
      { name: 'FreshLeague', ladder: 'FreshLeague', updatedAt: agoIso(10) },
    ];
    const s3Client = makeS3Client(existingIndexEntries);
    const logger = makeLogger();
    const fanOut = makeFanOut();
    const adapter = new R2LoadAdapter(s3Client, BUCKET, logger, fanOut);

    await adapter.finalize();

    const indexCall = findIndexPutCall(s3Client);
    expect(indexCall).toBeDefined();

    const indexBody = JSON.parse((indexCall![0] as PutObjectCommand).input.Body as string);
    expect(indexBody).toEqual([
      { name: 'FreshLeague', ladder: 'FreshLeague', updatedAt: agoIso(10) },
    ]);
  });

  it('keeps an index entry whose updatedAt is less than 1 hour old', async () => {
    const existingIndexEntries = [
      { name: 'FreshLeague', ladder: 'FreshLeague', updatedAt: agoIso(59) },
    ];
    const s3Client = makeS3Client(existingIndexEntries);
    const logger = makeLogger();
    const fanOut = makeFanOut();
    const adapter = new R2LoadAdapter(s3Client, BUCKET, logger, fanOut);

    await adapter.finalize();

    const indexCall = findIndexPutCall(s3Client);
    expect(indexCall).toBeDefined();

    const indexBody = JSON.parse((indexCall![0] as PutObjectCommand).input.Body as string);
    expect(indexBody).toEqual(existingIndexEntries);
  });

  it('drops an entry whose updatedAt is in the future instead of treating it as infinitely fresh', async () => {
    const existingIndexEntries = [
      { name: 'FutureLeague', ladder: 'FutureLeague', updatedAt: agoIso(-120) },
    ];
    const s3Client = makeS3Client(existingIndexEntries);
    const logger = makeLogger();
    const fanOut = makeFanOut();
    const adapter = new R2LoadAdapter(s3Client, BUCKET, logger, fanOut);

    await adapter.finalize();

    expect(findIndexPutCall(s3Client)).toBeUndefined();
    expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('index.json'));
  });

  it('drops an entry whose updatedAt is not a parseable date', async () => {
    const existingIndexEntries = [
      { name: 'CorruptLeague', ladder: 'CorruptLeague', updatedAt: 'not-a-date' },
    ];
    const s3Client = makeS3Client(existingIndexEntries);
    const logger = makeLogger();
    const fanOut = makeFanOut();
    const adapter = new R2LoadAdapter(s3Client, BUCKET, logger, fanOut);

    await adapter.finalize();

    expect(findIndexPutCall(s3Client)).toBeUndefined();
    expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('index.json'));
  });

  it('refuses to overwrite a non-empty index when the TTL filter would empty it (zero-entry floor)', async () => {
    const existingIndexEntries = [
      { name: 'OnlyLeague', ladder: 'OnlyLeague', updatedAt: agoIso(90) },
    ];
    const s3Client = makeS3Client(existingIndexEntries);
    const logger = makeLogger();
    const fanOut = makeFanOut();
    const adapter = new R2LoadAdapter(s3Client, BUCKET, logger, fanOut);

    await adapter.finalize();

    expect(findIndexPutCall(s3Client)).toBeUndefined();
    expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('index.json'));
    expect(fanOut.notifyIndexUpdated).not.toHaveBeenCalled();
  });

  it('does not trigger the zero-entry floor when only some (not all) entries age out', async () => {
    const existingIndexEntries = [
      { name: 'StaleLeague', ladder: 'StaleLeague', updatedAt: agoIso(90) },
      { name: 'FreshLeague', ladder: 'FreshLeague', updatedAt: agoIso(10) },
    ];
    const s3Client = makeS3Client(existingIndexEntries);
    const logger = makeLogger();
    const fanOut = makeFanOut();
    const adapter = new R2LoadAdapter(s3Client, BUCKET, logger, fanOut);

    await adapter.finalize();

    const indexCall = findIndexPutCall(s3Client);
    expect(indexCall).toBeDefined();
    expect(logger.error).not.toHaveBeenCalled();

    const indexBody = JSON.parse((indexCall![0] as PutObjectCommand).input.Body as string);
    expect(indexBody).toEqual([
      { name: 'FreshLeague', ladder: 'FreshLeague', updatedAt: agoIso(10) },
    ]);
    expect(fanOut.notifyIndexUpdated).toHaveBeenCalledTimes(1);
  });

  it('resets accumulated entries even when the index GET throws inside finalize()', async () => {
    const s3Client = makeS3ClientThrowingOnFirstGet([]);
    const logger = makeLogger();
    const fanOut = makeFanOut();
    const adapter = new R2LoadAdapter(s3Client, BUCKET, logger, fanOut);

    await adapter.load(buildLeague({ name: 'Settlers', ladder: 'Settlers' }), [], [], agoIso(5));

    await expect(adapter.finalize()).rejects.toThrow('simulated R2 GET failure');

    // Second invocation on the same adapter instance (warm Lambda reuse), no new load()
    // calls — if 'Settlers' had leaked past the failed finalize(), it would appear here.
    await adapter.finalize();

    const indexCall = findIndexPutCall(s3Client);
    expect(indexCall).toBeDefined();

    const indexBody = JSON.parse((indexCall![0] as PutObjectCommand).input.Body as string);
    expect(indexBody).toEqual([]);
  });

  it('resets accumulated entries even when the index PUT throws inside finalize()', async () => {
    const s3Client = makeS3ClientThrowingOnFirstPut([]);
    const logger = makeLogger();
    const fanOut = makeFanOut();
    const adapter = new R2LoadAdapter(s3Client, BUCKET, logger, fanOut);

    await adapter.load(buildLeague({ name: 'Settlers', ladder: 'Settlers' }), [], [], agoIso(5));

    await expect(adapter.finalize()).rejects.toThrow('simulated R2 PUT failure');

    // Second invocation on the same adapter instance (warm Lambda reuse), no new load()
    // calls — if 'Settlers' had leaked past the failed finalize(), it would appear here.
    await adapter.finalize();

    const indexCall = findIndexPutCall(s3Client);
    expect(indexCall).toBeDefined();

    const indexBody = JSON.parse((indexCall![0] as PutObjectCommand).input.Body as string);
    expect(indexBody).toEqual([]);
  });

  it('calls notifyIndexUpdated() after a successful index PUT even when indexEntries was empty going in', async () => {
    // Simulates an all-failed-extraction run: no load() call happens this run, but the
    // existing index still has fresh entries that survive the TTL filter and get
    // re-written as-is.
    const existingIndexEntries = [
      { name: 'FreshLeague', ladder: 'FreshLeague', updatedAt: agoIso(10) },
    ];
    const s3Client = makeS3Client(existingIndexEntries);
    const logger = makeLogger();
    const fanOut = makeFanOut();
    const adapter = new R2LoadAdapter(s3Client, BUCKET, logger, fanOut);

    await adapter.finalize();

    expect(fanOut.notifyIndexUpdated).toHaveBeenCalledTimes(1);

    const indexCall = findIndexPutCall(s3Client);
    const indexBody = JSON.parse((indexCall![0] as PutObjectCommand).input.Body as string);
    expect(indexBody).toEqual(existingIndexEntries);
  });
});
