import { League } from '@domain/entities/league.entity';
import { FlipTableRowDto } from '@application/dtos/flip-table.dto';

/**
 * Currency overview data structure
 */
export interface CurrencyOverview {
  Name: string;
  detailsId: string;
  chaosEquivalent: number;
}

/**
 * Repository interface for in-memory data storage
 * Stores processed league data, flip tables, currency information, and update timestamps
 */
export interface IDataStorageRepository {
  /**
   * Stores league data
   */
  setLeagues(leagues: Record<string, League>): Promise<void>;

  /**
   * Retrieves all stored leagues
   */
  getLeagues(): Promise<Record<string, League> | null>;

  /**
   * Stores flip tables for all leagues
   */
  setFlipTables(tables: Record<string, FlipTableRowDto[]>): Promise<void>;

  /**
   * Retrieves all stored flip tables
   */
  getFlipTables(): Promise<Record<string, FlipTableRowDto[]> | null>;

  /**
   * Retrieves flip table for a specific league
   */
  getFlipTableByLeague(leagueName: string): Promise<FlipTableRowDto[] | null>;

  /**
   * Stores currency data for all leagues
   */
  setCurrencyData(currency: Record<string, CurrencyOverview[]>): Promise<void>;

  /**
   * Retrieves all stored currency data
   */
  getCurrencyData(): Promise<Record<string, CurrencyOverview[]> | null>;

  /**
   * Retrieves currency data for a specific league
   */
  getCurrencyByLeague(leagueName: string): Promise<CurrencyOverview[] | null>;

  /**
   * Stores update timestamps for all leagues
   */
  setUpdateTimestamps(timestamps: Record<string, string>): Promise<void>;

  /**
   * Retrieves all stored update timestamps
   */
  getUpdateTimestamps(): Promise<Record<string, string> | null>;

  /**
   * Retrieves update timestamp for a specific league
   */
  getUpdateTimestamp(leagueName: string): Promise<string | null>;

  /**
   * Clears all stored data
   */
  clearAll(): void;

  /**
   * Retrieves all stored data at once
   */
  getAllData(): Promise<{
    leagues: Record<string, League> | null;
    flipTables: Record<string, FlipTableRowDto[]> | null;
    currency: Record<string, CurrencyOverview[]> | null;
    timestamps: Record<string, string> | null;
  }>;
}
