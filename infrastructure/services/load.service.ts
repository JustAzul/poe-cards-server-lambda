/* eslint-disable no-console */

// Domain entities
import { League } from '@domain/entities/league.entity';
import { CurrencyItem } from '@domain/value-objects/currency-item';
import { ProfitTableRowDto } from '@infrastructure/dtos/profit-table-row.dto';

/**
 * Service responsible for displaying processed data to console
 */
export class LoadService {
  constructor() {}

  /**
   * Display a single league's data to console
   *
   * @param league - The league entity
   * @param profitTable - Profit table data for this league
   * @param currency - Currency data for this league
   * @param timestamp - Update timestamp for this league
   */
  async load(
    league: League,
    profitTable: ProfitTableRowDto[],
    currency: CurrencyItem[],
    timestamp: string,
  ): Promise<void> {
    console.log(`Loading data for league: ${league.name}`);
    console.log(`Timestamp: ${timestamp}`);
    console.log(`Profit table entries: ${profitTable.length}`);
    console.log(`Currency items: ${currency.length}`);
    console.log('Profit table data:', profitTable);
    console.log('Currency data:', currency);
  }
}
