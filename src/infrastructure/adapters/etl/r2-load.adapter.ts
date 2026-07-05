import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { League } from '@domain/entities/league.entity';
import { CurrencyItem } from '@domain/value-objects/currency-item';
import { ProfitTableRowDto } from '@infrastructure/dtos/profit-table-row.dto';
import { ILoadAdapter } from '@infrastructure/adapters/etl/load.adapter';
import { FanOutService } from '@infrastructure/adapters/etl/fan-out.service';
import { buildLeaguePayload } from '@runtime/etl-runtime';
import { Logger } from '@shared/logger';

const LEAGUES_PREFIX = 'leagues';
const INDEX_KEY = 'index.json';
const JSON_CONTENT_TYPE = 'application/json';

// S3/R2 error names observed for a GetObject on a key that doesn't exist yet
// (e.g. the very first run, before any index.json has been written).
const MISSING_KEY_ERROR_NAMES = ['NoSuchKey', 'NotFound'] as const;

interface LeagueIndexEntry {
  name: string;
  ladder: string;
  updatedAt: string;
}

/**
 * ETL Pipeline Load Adapter
 * Persists processed league data to Cloudflare R2 (S3-compatible) and fans out
 * revalidate/broadcast notifications after each successful write.
 */
export class R2LoadAdapter implements ILoadAdapter {
  private readonly indexEntries: LeagueIndexEntry[] = [];

  constructor(
    private readonly s3Client: S3Client,
    private readonly bucket: string,
    private readonly logger: Logger,
    private readonly fanOut: FanOutService,
  ) {}

  async load(
    league: League,
    profitTable: ProfitTableRowDto[],
    currency: CurrencyItem[],
    timestamp: string,
  ): Promise<void> {
    const payload = buildLeaguePayload(profitTable, currency, timestamp);
    const key = `${LEAGUES_PREFIX}/${encodeURIComponent(league.name)}.json`;

    await this.s3Client.send(new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: JSON.stringify(payload),
      ContentType: JSON_CONTENT_TYPE,
    }));

    this.indexEntries.push({ name: league.name, ladder: league.ladder, updatedAt: timestamp });
    this.logger.log(`Persisted data for league: ${league.name} (${payload.entryCount} entries)`);

    await this.fanOut.notifyLeagueUpdated(league.name);
  }

  async finalize(): Promise<void> {
    const existingEntries = await this.fetchExistingIndex();

    // Merge this run's entries over the existing index by league name — a partial
    // run (some leagues failed extraction/transform) must not erase leagues that
    // were persisted by an earlier successful run.
    const mergedByName = new Map(existingEntries.map((entry) => [entry.name, entry]));
    for (const entry of this.indexEntries) {
      mergedByName.set(entry.name, entry);
    }

    await this.s3Client.send(new PutObjectCommand({
      Bucket: this.bucket,
      Key: INDEX_KEY,
      Body: JSON.stringify([...mergedByName.values()]),
      ContentType: JSON_CONTENT_TYPE,
    }));

    this.reset();
  }

  /** Discards this run's accumulated index entries without writing anything. */
  reset(): void {
    this.indexEntries.length = 0;
  }

  private async fetchExistingIndex(): Promise<LeagueIndexEntry[]> {
    try {
      const response = await this.s3Client.send(new GetObjectCommand({
        Bucket: this.bucket,
        Key: INDEX_KEY,
      }));

      const body = await response.Body?.transformToString();
      return body ? (JSON.parse(body) as LeagueIndexEntry[]) : [];
    } catch (error: unknown) {
      if (this.isMissingKeyError(error)) return [];
      throw error;
    }
  }

  private isMissingKeyError(error: unknown): boolean {
    if (!(error instanceof Error)) return false;
    return (MISSING_KEY_ERROR_NAMES as readonly string[]).includes(error.name);
  }
}
