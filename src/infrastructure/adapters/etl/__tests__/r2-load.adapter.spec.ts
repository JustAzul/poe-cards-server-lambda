import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { League } from '@domain/entities/league.entity';
import { ProfitTableRowDto } from '@infrastructure/dtos/profit-table-row.dto';
import { R2LoadAdapter } from '@infrastructure/adapters/etl/r2-load.adapter';
import { FanOutService } from '@infrastructure/adapters/etl/fan-out.service';
import { ItemClass } from '@domain/value-objects/item-class.enum';

const BUCKET = 'poe-cards';

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

function makeS3Client() {
  return { send: jest.fn().mockResolvedValue({}) } as unknown as jest.Mocked<S3Client>;
}

function makeFanOut() {
  return { notifyLeagueUpdated: jest.fn().mockResolvedValue(undefined) } as unknown as jest.Mocked<FanOutService>;
}

describe('R2LoadAdapter', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('writes the league payload to R2 under an encoded key', async () => {
    const s3Client = makeS3Client();
    const logger = makeLogger();
    const fanOut = makeFanOut();
    const adapter = new R2LoadAdapter(s3Client, BUCKET, logger, fanOut);
    const league = buildLeague({ name: 'Hardcore Settlers' });

    await adapter.load(league, [buildProfitRow()], [], '2025-01-01T00:00:00.000Z');

    expect(s3Client.send).toHaveBeenCalledTimes(1);
    const command = s3Client.send.mock.calls[0][0] as PutObjectCommand;
    expect(command.input.Bucket).toBe(BUCKET);
    expect(command.input.Key).toBe('leagues/Hardcore%20Settlers.json');
    expect(command.input.ContentType).toBe('application/json');

    const body = JSON.parse(command.input.Body as string);
    expect(body.entryCount).toBe(1);
    expect(body.updatedAt).toBe('2025-01-01T00:00:00.000Z');
  });

  it('fires the fan-out notification after the R2 write', async () => {
    const s3Client = makeS3Client();
    const logger = makeLogger();
    const fanOut = makeFanOut();
    const adapter = new R2LoadAdapter(s3Client, BUCKET, logger, fanOut);
    const league = buildLeague({ name: 'Settlers' });

    await adapter.load(league, [buildProfitRow()], [], '2025-01-01T00:00:00.000Z');

    expect(fanOut.notifyLeagueUpdated).toHaveBeenCalledWith('Settlers');
  });

  it('accumulates an index entry per league and writes it on finalize', async () => {
    const s3Client = makeS3Client();
    const logger = makeLogger();
    const fanOut = makeFanOut();
    const adapter = new R2LoadAdapter(s3Client, BUCKET, logger, fanOut);

    await adapter.load(buildLeague({ name: 'Settlers', ladder: 'Settlers' }), [], [], '2025-01-01T00:00:00.000Z');
    await adapter.load(buildLeague({ name: 'Standard', ladder: 'Standard' }), [], [], '2025-01-02T00:00:00.000Z');
    await adapter.finalize();

    const indexCall = s3Client.send.mock.calls.find(
      ([command]) => (command as PutObjectCommand).input.Key === 'index.json',
    );
    expect(indexCall).toBeDefined();

    const indexBody = JSON.parse((indexCall![0] as PutObjectCommand).input.Body as string);
    expect(indexBody).toEqual([
      { name: 'Settlers', ladder: 'Settlers', updatedAt: '2025-01-01T00:00:00.000Z' },
      { name: 'Standard', ladder: 'Standard', updatedAt: '2025-01-02T00:00:00.000Z' },
    ]);
  });
});
