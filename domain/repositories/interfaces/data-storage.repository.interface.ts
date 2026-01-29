import { LeagueEntity } from '@domain/entities/league.entity';
import { FlipTableRowDto } from '@infrastructure/dtos/flip-table.dto';

/**
 * Currency overview data structure
 */
export interface CurrencyOverview {
  name: string;
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
  setLeagues(leagues: LeagueEntity[]): Promise<void>;

  /**
   * Retrieves all stored leagues
   */
  getLeagues(): Promise<LeagueEntity[] | null>;

  /**
   * Stores flip tables for all leagues
   */
  setFlipTables(tables: Record<string, FlipTableRowDto[]>): Promise<void>;

  /**
   * Retrieves all stored flip tables
   */
  getFlipTables(): Promise<Record<string, FlipTableRowDto[]> | null>;

  /**
   * Stores currency data for all leagues
   */
  setCurrencyData(currency: Record<string, CurrencyOverview[]>): Promise<void>;

  /**
   * Retrieves all stored currency data
   */
  getCurrencyData(): Promise<Record<string, CurrencyOverview[]> | null>;

  /**
   * Stores update timestamps for all leagues
   */
  setUpdateTimestamps(timestamps: Record<string, string>): Promise<void>;

  /**
   * Retrieves all stored update timestamps
   */
  getUpdateTimestamps(): Promise<Record<string, string> | null>;
}
