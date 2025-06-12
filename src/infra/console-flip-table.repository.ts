/* eslint-disable no-console */
import { IFlipTableRepository } from 'application/ports/flip-table-repository.interface';
import { FlipTableRow } from 'application/use-cases/generate-flip-table.use-case';

export default class ConsoleFlipTableRepository implements IFlipTableRepository {
  private readonly tables: Record<string, FlipTableRow[]> = {};

  async save(table: FlipTableRow[], league: string): Promise<void> {
    this.tables[league] = table;
    console.log({ league, table });
  }

  get data(): Record<string, FlipTableRow[]> {
    return this.tables;
  }
}
