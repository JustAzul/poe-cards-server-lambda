import { CurrencyItem } from '@domain/value-objects/currency-item';
import { ProfitTableRowDto } from '@infrastructure/dtos/profit-table-row.dto';
import { SqliteLeagueStore, LeagueDataResponse, CurrencyRatesDto } from '@infrastructure/persistence/sqlite/sqlite-league-store';
import { App } from '@infrastructure/app';
import { Logger } from '@shared/logger';

const CURRENCY_NAME_MAP = {
  exalted: 'Exalted Orb',
  divine: 'Divine Orb',
  annul: 'Orb of Annulment',
  mirror: 'Mirror of Kalandra',
} as const;

export function buildCurrencyRates(currency: CurrencyItem[]): CurrencyRatesDto {
  const getRate = (name: string): number => {
    const match = currency.find((item) => item.currencyTypeName === name);
    return match?.chaosEquivalent ?? 0;
  };

  return {
    exalted: getRate(CURRENCY_NAME_MAP.exalted),
    divine: getRate(CURRENCY_NAME_MAP.divine),
    annul: getRate(CURRENCY_NAME_MAP.annul),
    mirror: getRate(CURRENCY_NAME_MAP.mirror),
  };
}

export function buildLeaguePayload(
  profitTable: ProfitTableRowDto[],
  currency: CurrencyItem[],
  timestamp: string,
): LeagueDataResponse {
  return {
    data: profitTable,
    currencyRates: buildCurrencyRates(currency),
    updatedAt: timestamp,
    entryCount: profitTable.length,
  };
}

export class EtlRuntime {
  private refreshInFlight: Promise<{ processed: number; failed: number }> | null = null;

  constructor(
    private readonly app: App,
    private readonly store: SqliteLeagueStore,
    private readonly logger: Logger,
  ) {}

  isDatabaseEmpty(): boolean {
    return this.store.isEmpty();
  }

  getStatus() {
    return {
      isRefreshing: this.refreshInFlight !== null,
      latestRun: this.store.getLatestRefreshRun(),
      leagues: this.store.listLeagueNames(),
    };
  }

  listDebugLeagues(): string[] {
    return this.store.listLeagueNames();
  }

  getDebugLeague(leagueName: string): LeagueDataResponse | null {
    return this.store.getLeaguePayload(leagueName);
  }

  async refresh(): Promise<{ processed: number; failed: number }> {
    if (this.refreshInFlight) {
      this.logger.warn('Refresh requested while another refresh is already running');
      return this.refreshInFlight;
    }

    this.refreshInFlight = this.runRefresh();

    try {
      return await this.refreshInFlight;
    } finally {
      this.refreshInFlight = null;
    }
  }

  private async runRefresh(): Promise<{ processed: number; failed: number }> {
    const startedAt = new Date().toISOString();
    const runId = this.store.startRefreshRun(startedAt);

    try {
      const result = await this.app.execute();
      this.store.finishRefreshRunSuccess(runId, new Date().toISOString(), result.processed, result.failed);
      return result;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.store.finishRefreshRunFailure(runId, new Date().toISOString(), message);
      throw error;
    }
  }
}
