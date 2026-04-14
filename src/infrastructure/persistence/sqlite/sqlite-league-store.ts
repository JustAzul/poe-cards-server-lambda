import Database from 'better-sqlite3';
import { ProfitTableRowDto } from '@infrastructure/dtos/profit-table-row.dto';
import { openSqliteDatabase, applySqliteSchema } from '@infrastructure/persistence/sqlite/sqlite';

export interface CurrencyRatesDto {
  exalted: number;
  divine: number;
  annul: number;
  mirror: number;
}

export interface LeagueDataResponse {
  data: ProfitTableRowDto[];
  currencyRates: CurrencyRatesDto;
  updatedAt: string;
  entryCount: number;
}

export interface RefreshRunRecord {
  id: number;
  status: string;
  startedAt: string;
  finishedAt: string | null;
  processedCount: number | null;
  failedCount: number | null;
  errorMessage: string | null;
}

export class SqliteLeagueStore {
  private readonly db: Database.Database;

  constructor(databasePath?: string) {
    this.db = openSqliteDatabase(databasePath);
    applySqliteSchema(this.db);
  }

  isEmpty(): boolean {
    const row = this.db.prepare('SELECT COUNT(*) as count FROM leagues').get() as { count: number };
    return row.count === 0;
  }

  upsertLeaguePayload(leagueName: string, payload: LeagueDataResponse): void {
    const upsertLeague = this.db.prepare(`
      INSERT INTO leagues (name, updated_at, entry_count, currency_rates_json)
      VALUES (@name, @updatedAt, @entryCount, @currencyRatesJson)
      ON CONFLICT(name) DO UPDATE SET
        updated_at = excluded.updated_at,
        entry_count = excluded.entry_count,
        currency_rates_json = excluded.currency_rates_json
    `);

    const upsertPayload = this.db.prepare(`
      INSERT INTO league_payloads (league_name, payload_json)
      VALUES (@leagueName, @payloadJson)
      ON CONFLICT(league_name) DO UPDATE SET
        payload_json = excluded.payload_json
    `);

    const transaction = this.db.transaction(() => {
      upsertLeague.run({
        name: leagueName,
        updatedAt: payload.updatedAt,
        entryCount: payload.entryCount,
        currencyRatesJson: JSON.stringify(payload.currencyRates),
      });
      upsertPayload.run({
        leagueName,
        payloadJson: JSON.stringify(payload),
      });
    });

    transaction();
  }

  listLeagueNames(): string[] {
    const rows = this.db.prepare('SELECT name FROM leagues ORDER BY name ASC').all() as Array<{ name: string }>;
    return rows.map((row) => row.name);
  }

  getLeaguePayload(leagueName: string): LeagueDataResponse | null {
    const row = this.db.prepare(
      'SELECT payload_json as payloadJson FROM league_payloads WHERE league_name = ?',
    ).get(leagueName) as { payloadJson: string } | undefined;

    if (!row) return null;

    const payload = JSON.parse(row.payloadJson) as LeagueDataResponse;
    return payload;
  }

  startRefreshRun(startedAt: string): number {
    const result = this.db.prepare(
      'INSERT INTO refresh_runs (status, started_at) VALUES (?, ?)',
    ).run('running', startedAt);

    if (typeof result.lastInsertRowid !== 'number' && typeof result.lastInsertRowid !== 'bigint') {
      throw new Error('Failed to create refresh run');
    }

    return Number(result.lastInsertRowid);
  }

  finishRefreshRunSuccess(runId: number, finishedAt: string, processedCount: number, failedCount: number): void {
    this.db.prepare(`
      UPDATE refresh_runs
      SET status = ?, finished_at = ?, processed_count = ?, failed_count = ?, error_message = NULL
      WHERE id = ?
    `).run('success', finishedAt, processedCount, failedCount, runId);
  }

  finishRefreshRunFailure(runId: number, finishedAt: string, errorMessage: string): void {
    this.db.prepare(`
      UPDATE refresh_runs
      SET status = ?, finished_at = ?, error_message = ?
      WHERE id = ?
    `).run('failed', finishedAt, errorMessage, runId);
  }

  getLatestRefreshRun(): RefreshRunRecord | null {
    const row = this.db.prepare(`
      SELECT
        id,
        status,
        started_at as startedAt,
        finished_at as finishedAt,
        processed_count as processedCount,
        failed_count as failedCount,
        error_message as errorMessage
      FROM refresh_runs
      ORDER BY id DESC
      LIMIT 1
    `).get() as RefreshRunRecord | undefined;

    return row ?? null;
  }
}
