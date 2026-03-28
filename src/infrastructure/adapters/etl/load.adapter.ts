// Domain entities
import { League } from '@domain/entities/league.entity';
import { CurrencyItem } from '@domain/value-objects/currency-item';
import { ProfitTableRowDto } from '@infrastructure/dtos/profit-table-row.dto';
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
 * Responsible for displaying processed data to console
 */
export class LoadAdapter implements ILoadAdapter {
  constructor(private readonly logger: Logger) {}

  /**
   * Display a single league's data to console
   *
   * @param league - The league entity
   * @param profitTable - Profit table data for this league
   * @param currency - Currency data for this league
   * @param timestamp - Update timestamp for this league
   */
  load(
    league: League,
    profitTable: ProfitTableRowDto[],
    currency: CurrencyItem[],
    timestamp: string,
  ): void {
    this.logger.log(`Loading data for league: ${league.name}`);
    this.logger.log(`Timestamp: ${timestamp}`);
    this.logger.log(`Profit table: ${profitTable.length} entries`);
    this.logger.log(`Currency: ${currency.length} items`);
  }
}
