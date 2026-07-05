import { CurrencyItem } from '@domain/value-objects/currency-item';
import { ProfitTableRowDto } from '@infrastructure/dtos/profit-table-row.dto';
import { App } from '@infrastructure/app';
import { Logger } from '@shared/logger';

const CURRENCY_NAME_MAP = {
  exalted: 'Exalted Orb',
  divine: 'Divine Orb',
  annul: 'Orb of Annulment',
  mirror: 'Mirror of Kalandra',
} as const;

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

interface RefreshRunSnapshot {
  startedAt: string;
  finishedAt: string | null;
  processed: number | null;
  failed: number | null;
  status: 'running' | 'success' | 'failed';
  errorMessage: string | null;
}

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

  private lastRun: RefreshRunSnapshot | null = null;

  constructor(
    private readonly app: App,
    private readonly logger: Logger,
  ) {}

  getStatus() {
    return {
      isRefreshing: this.refreshInFlight !== null,
      latestRun: this.lastRun,
    };
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
    this.lastRun = {
      startedAt,
      finishedAt: null,
      processed: null,
      failed: null,
      status: 'running',
      errorMessage: null,
    };
    this.logger.log(`ETL refresh started at ${startedAt}`);

    try {
      const result = await this.app.execute();
      const finishedAt = new Date().toISOString();
      this.lastRun = {
        startedAt, finishedAt, processed: result.processed, failed: result.failed, status: 'success', errorMessage: null,
      };
      this.logger.log(`ETL refresh finished at ${finishedAt}: ${result.processed} processed, ${result.failed} failed`);
      return result;
    } catch (error: unknown) {
      const finishedAt = new Date().toISOString();
      const message = error instanceof Error ? error.message : String(error);
      this.lastRun = {
        startedAt, finishedAt, processed: null, failed: null, status: 'failed', errorMessage: message,
      };
      this.logger.error(`ETL refresh failed at ${finishedAt}: ${message}`);
      throw error;
    }
  }
}
