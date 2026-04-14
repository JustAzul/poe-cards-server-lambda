// Domain entities
import { League } from '@domain/entities/league.entity';
import { CurrencyItem } from '@domain/value-objects/currency-item';
import { ProfitTableRowDto } from '@infrastructure/dtos/profit-table-row.dto';
import { SqliteLeagueStore } from '@infrastructure/persistence/sqlite/sqlite-league-store';
import { buildLeaguePayload } from '@runtime/etl-runtime';
import { Logger } from '@shared/logger';

export interface ILoadAdapter {
  load(
    league: League,
    profitTable: ProfitTableRowDto[],
    currency: CurrencyItem[],
    timestamp: string,
  ): void;
}

/**
 * ETL Pipeline Load Adapter
 * Responsible for persisting processed data into SQLite
 */
export class LoadAdapter implements ILoadAdapter {
  constructor(
    private readonly store: SqliteLeagueStore,
    private readonly logger: Logger,
  ) {}

  load(
    league: League,
    profitTable: ProfitTableRowDto[],
    currency: CurrencyItem[],
    timestamp: string,
  ): void {
    const payload = buildLeaguePayload(profitTable, currency, timestamp);
    this.store.upsertLeaguePayload(league.name, payload);
    this.logger.log(`Persisted data for league: ${league.name} (${payload.entryCount} entries)`);
  }
}
