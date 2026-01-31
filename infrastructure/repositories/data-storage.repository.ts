import { LeagueEntity } from '@domain/entities/league.entity';
import { CurrencyItem } from '@domain/entities/currency-item.entity';
import { FlipTableRowDto } from '@infrastructure/dtos/flip-table.dto';
import {
  IDataStorageRepository,
} from '@domain/repositories/interfaces/data-storage.repository.interface';

/**
 * In-memory implementation of data storage repository
 * Stores processed data for quick access without external dependencies
 */
export class InMemoryDataStorageRepository implements IDataStorageRepository {
  private leagues: LeagueEntity[] | null = null;
  private flipTables: Record<string, FlipTableRowDto[]> | null = null;
  private currency: Record<string, CurrencyItem[]> | null = null;
  private timestamps: Record<string, string> | null = null;

  async setLeagues(leagues: LeagueEntity[]): Promise<void> {
    this.leagues = leagues;
  }

  async getLeagues(): Promise<LeagueEntity[] | null> {
    return this.leagues;
  }

  async setFlipTables(tables: Record<string, FlipTableRowDto[]>): Promise<void> {
    this.flipTables = tables;
  }

  async getFlipTables(): Promise<Record<string, FlipTableRowDto[]> | null> {
    return this.flipTables;
  }

  async setCurrencyData(currency: Record<string, CurrencyItem[]>): Promise<void> {
    this.currency = currency;
  }

  async getCurrencyData(): Promise<Record<string, CurrencyItem[]> | null> {
    return this.currency;
  }

  async setUpdateTimestamps(timestamps: Record<string, string>): Promise<void> {
    this.timestamps = timestamps;
  }

  async getUpdateTimestamps(): Promise<Record<string, string> | null> {
    return this.timestamps;
  }
}

export const dataStorageRepository = new InMemoryDataStorageRepository();
