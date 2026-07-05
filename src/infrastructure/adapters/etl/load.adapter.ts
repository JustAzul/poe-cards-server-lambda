// Domain entities
import { League } from '@domain/entities/league.entity';
import { CurrencyItem } from '@domain/value-objects/currency-item';
import { ProfitTableRowDto } from '@infrastructure/dtos/profit-table-row.dto';

export interface ILoadAdapter {
  load(
    league: League,
    profitTable: ProfitTableRowDto[],
    currency: CurrencyItem[],
    timestamp: string,
  ): Promise<void>;

  /** Optional post-run step (e.g. writing an aggregate index). */
  finalize?(): Promise<void>;

  /**
   * Optional cleanup for a run that aborted before `finalize()` could run (e.g. the
   * extract generator threw mid-iteration). Must discard any in-memory state
   * accumulated by `load()` so it never bleeds into a later invocation's `finalize()`.
   */
  reset?(): void;
}
