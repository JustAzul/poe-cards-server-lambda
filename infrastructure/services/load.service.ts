/* eslint-disable no-console */

// Domain entities
import { LeagueEntity } from '@domain/entities/league.entity';
import { CurrencyItem } from '@domain/entities/currency-item.entity';
import { FlipTableRowDto } from '@infrastructure/dtos/flip-table.dto';

/**
 * Service responsible for displaying processed data to console
 */
export class LoadService {
  constructor() {}

  /**
   * Display a single league's data to console
   *
   * @param league - The league entity
   * @param flipTable - Flip table data for this league
   * @param currency - Currency data for this league
   * @param timestamp - Update timestamp for this league
   */
  async load(
    league: LeagueEntity,
    flipTable: FlipTableRowDto[],
    currency: CurrencyItem[],
    timestamp: string,
  ): Promise<void> {
    console.log(`Loading data for league: ${league.name}`);
    console.log(`Timestamp: ${timestamp}`);
    console.log(`Flip table entries: ${flipTable.length}`);
    console.log(`Currency items: ${currency.length}`);
    console.log('Flip table data:', flipTable);
    console.log('Currency data:', currency);
  }
}
