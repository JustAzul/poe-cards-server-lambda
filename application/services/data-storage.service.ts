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
    leagues: LeagueEntity[],
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
}

export const dataStorageService = new DataStorageService();
