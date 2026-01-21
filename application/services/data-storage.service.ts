import { LeagueEntity } from '@domain/entities/league.entity';
import { FlipTableRowDto } from '@application/dtos/flip-table.dto';
import { dataStorageRepository } from '@infrastructure/repositories/data-storage.repository';
import { CurrencyOverview } from '@domain/repositories/interfaces/data-storage.repository.interface';

/**
 * Application service for managing in-memory data storage
 * Provides high-level operations for storing and retrieving processed league data
 */
export class DataStorageService {
  public readonly dataStorageRepository = dataStorageRepository;

  /**
   * Stores all processed data in parallel
   * @param leagues - All active leagues
   * @param flipTables - Flip tables for all leagues
   * @param currency - Currency data for all leagues
   * @param timestamps - Update timestamps for all leagues
   */
  async storeAllData(
    leagues: Record<string, LeagueEntity>,
    flipTables: Record<string, FlipTableRowDto[]>,
    currency: Record<string, CurrencyOverview[]>,
    timestamps: Record<string, string>,
  ): Promise<void> {
    await Promise.all([
      dataStorageRepository.setLeagues(leagues),
      dataStorageRepository.setFlipTables(flipTables),
      dataStorageRepository.setCurrencyData(currency),
      dataStorageRepository.setUpdateTimestamps(timestamps),
    ]);
  }

  /**
   * Retrieves all stored data at once
   */
  async retrieveAllData(): Promise<{
    leagues: Record<string, LeagueEntity> | null;
    flipTables: Record<string, FlipTableRowDto[]> | null;
    currency: Record<string, CurrencyOverview[]> | null;
    timestamps: Record<string, string> | null;
  }> {
    return await dataStorageRepository.getAllData();
  }

  /**
   * Gets flip table for a specific league
   */
  async getLeagueFlipTable(leagueName: string): Promise<FlipTableRowDto[] | null> {
    return await dataStorageRepository.getFlipTableByLeague(leagueName);
  }

  /**
   * Gets currency data for a specific league
   */
  async getLeagueCurrency(leagueName: string): Promise<CurrencyOverview[] | null> {
    return await dataStorageRepository.getCurrencyByLeague(leagueName);
  }

  /**
   * Gets update timestamp for a specific league
   */
  async getLeagueUpdateTime(leagueName: string): Promise<string | null> {
    return await dataStorageRepository.getUpdateTimestamp(leagueName);
  }

  /**
   * Clears all stored data
   */
  clearAllData(): void {
    dataStorageRepository.clearAll();
  }
}

export const dataStorageService = new DataStorageService();
