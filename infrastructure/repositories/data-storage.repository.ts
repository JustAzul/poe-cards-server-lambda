import { LeagueEntity } from '@domain/entities/league.entity';
import { FlipTableRowDto } from '@application/dtos/flip-table.dto';
import {
  IDataStorageRepository,
  CurrencyOverview,
} from '@domain/repositories/interfaces/data-storage.repository.interface';

/**
 * In-memory implementation of data storage repository
 * Stores processed data for quick access without external dependencies
 */
export class InMemoryDataStorageRepository implements IDataStorageRepository {
  private leagues: Record<string, LeagueEntity> | null = null;
  private flipTables: Record<string, FlipTableRowDto[]> | null = null;
  private currency: Record<string, CurrencyOverview[]> | null = null;
  private timestamps: Record<string, string> | null = null;

  async setLeagues(leagues: Record<string, LeagueEntity>): Promise<void> {
    this.leagues = leagues;
  }

  async getLeagues(): Promise<Record<string, LeagueEntity> | null> {
    return this.leagues;
  }

  async setFlipTables(tables: Record<string, FlipTableRowDto[]>): Promise<void> {
    this.flipTables = tables;
  }

  async getFlipTables(): Promise<Record<string, FlipTableRowDto[]> | null> {
    return this.flipTables;
  }

  async getFlipTableByLeague(leagueName: string): Promise<FlipTableRowDto[] | null> {
    if (!this.flipTables || !this.flipTables[leagueName]) {
      return null;
    }
    return this.flipTables[leagueName];
  }

  async setCurrencyData(currency: Record<string, CurrencyOverview[]>): Promise<void> {
    this.currency = currency;
  }

  async getCurrencyData(): Promise<Record<string, CurrencyOverview[]> | null> {
    return this.currency;
  }

  async getCurrencyByLeague(leagueName: string): Promise<CurrencyOverview[] | null> {
    if (!this.currency || !this.currency[leagueName]) {
      return null;
    }
    return this.currency[leagueName];
  }

  async setUpdateTimestamps(timestamps: Record<string, string>): Promise<void> {
    this.timestamps = timestamps;
  }

  async getUpdateTimestamps(): Promise<Record<string, string> | null> {
    return this.timestamps;
  }

  async getUpdateTimestamp(leagueName: string): Promise<string | null> {
    if (!this.timestamps || !this.timestamps[leagueName]) {
      return null;
    }
    return this.timestamps[leagueName];
  }

  clearAll(): void {
    this.leagues = null;
    this.flipTables = null;
    this.currency = null;
    this.timestamps = null;
  }

  async getAllData(): Promise<{
    leagues: Record<string, LeagueEntity> | null;
    flipTables: Record<string, FlipTableRowDto[]> | null;
    currency: Record<string, CurrencyOverview[]> | null;
    timestamps: Record<string, string> | null;
  }> {
    return {
      leagues: this.leagues,
      flipTables: this.flipTables,
      currency: this.currency,
      timestamps: this.timestamps,
    };
  }
}

export const dataStorageRepository = new InMemoryDataStorageRepository();
