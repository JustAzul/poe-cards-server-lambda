import { LeagueEntity } from '@domain/entities/league.entity';
import { FlipTableRowDto } from '@infrastructure/dtos/flip-table.dto';
import {
  CurrencyOverview,
  IDataStorageRepository,
} from '@domain/repositories/interfaces/data-storage.repository.interface';

// Default instance with concrete dependencies
import { dataStorageRepository as _dataStorageRepository } from '@infrastructure/repositories/data-storage.repository';

/**
 * Application service for orchestrating data storage operations
 * Provides high-level operations for storing and retrieving processed league data
 */
export class StorageService {
  constructor(
    private readonly repository: IDataStorageRepository,
  ) {}

  /**
   * Store a single league's data incrementally
   * Retrieves existing data, merges with new league data, and persists back
   *
   * @param league - The league entity to store
   * @param flipTable - Flip table data for this league
   * @param currency - Currency data for this league
   * @param timestamp - Update timestamp for this league
   */
  async storeLeagueData(
    league: LeagueEntity,
    flipTable: FlipTableRowDto[],
    currency: CurrencyOverview[],
    timestamp: string,
  ): Promise<void> {
    // Get existing data in parallel
    const [existingLeagues, existingFlipTables, existingCurrency, existingTimestamps] = await Promise.all([
      this.repository.getLeagues(),
      this.repository.getFlipTables(),
      this.repository.getCurrencyData(),
      this.repository.getUpdateTimestamps(),
    ]);

    // Build updated data structures
    const leagues = existingLeagues || [];
    const leagueExists = leagues.some((l) => l.name === league.name);
    if (!leagueExists) {
      leagues.push(league);
    }

    const flipTables = existingFlipTables || {};
    flipTables[league.name] = flipTable;

    const currencyData = existingCurrency || {};
    currencyData[league.name] = currency;

    const timestamps = existingTimestamps || {};
    timestamps[league.name] = timestamp;

    // Persist all updated data in parallel
    await Promise.all([
      this.repository.setLeagues(leagues),
      this.repository.setFlipTables(flipTables),
      this.repository.setCurrencyData(currencyData),
      this.repository.setUpdateTimestamps(timestamps),
    ]);
  }

  /**
   * Retrieve all stored leagues
   */
  async getLeagues(): Promise<LeagueEntity[] | null> {
    return this.repository.getLeagues();
  }

  /**
   * Retrieve flip tables for all leagues
   */
  async getFlipTables(): Promise<Record<string, FlipTableRowDto[]> | null> {
    return this.repository.getFlipTables();
  }

  /**
   * Retrieve currency data for all leagues
   */
  async getCurrencyData(): Promise<Record<string, CurrencyOverview[]> | null> {
    return this.repository.getCurrencyData();
  }

  /**
   * Retrieve update timestamps for all leagues
   */
  async getUpdateTimestamps(): Promise<Record<string, string> | null> {
    return this.repository.getUpdateTimestamps();
  }
}

export const storageService = new StorageService(_dataStorageRepository);
