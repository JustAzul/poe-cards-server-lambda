import { FlipTableRow } from 'application/use-cases/generate-flip-table.use-case';

export interface IFlipTableRepository {
  save(table: FlipTableRow[], league: string): Promise<void>;
}
