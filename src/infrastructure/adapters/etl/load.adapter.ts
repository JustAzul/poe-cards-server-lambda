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
}
