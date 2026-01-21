/* eslint-disable no-console */

// Domain entities
import { LeagueEntity } from '@domain/entities/league.entity';
import { FlipTableRowDto } from '@application/dtos/flip-table.dto';

// Application services
import { DataStorageService } from '@application/services/data-storage.service';

// Interfaces
import { CurrencyOverview } from '@domain/repositories/interfaces/data-storage.repository.interface';

// Infrastructure types
import {
  UpdateTimestamps,
  FlipTableResults,
  CurrencyResultsMap,
} from '@infrastructure/types/etl.types';

/**
 * Service responsible for loading processed data into storage
 * Handles persisting leagues and processed results
 */
export class LoadService {
  constructor(
    private readonly dataStorageService: DataStorageService,
  ) {}

  /**
   * Load a single league's data incrementally into storage
   *
   * Retrieves existing data, adds/updates the new league's data, and persists back
   *
   * @param league - The league entity to store
   * @param flipTable - Flip table data for this league
   * @param currency - Currency data for this league
   * @param timestamp - Update timestamp for this league
   */
  async loadLeague(
    league: LeagueEntity,
    flipTable: FlipTableRowDto[],
    currency: CurrencyOverview[],
    timestamp: string,
  ): Promise<void> {
    console.log(`Loading data for league: ${league.name}`);

    const repository = this.dataStorageService.dataStorageRepository;

    // Get existing data
    const [existingLeagues, existingFlipTables, existingCurrency, existingTimestamps] =
      await Promise.all([
        repository.getLeagues(),
        repository.getFlipTables(),
        repository.getCurrencyData(),
        repository.getUpdateTimestamps(),
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

    // Persist updated data
    await Promise.all([
      repository.setLeagues(leagues),
      repository.setFlipTables(flipTables),
      repository.setCurrencyData(currencyData),
      repository.setUpdateTimestamps(timestamps),
    ]);
  }

  /**
   * Load processed data into storage (batch processing)
   *
   * Stores leagues and their processed data (flip tables, currency results, timestamps)
   * into the data storage repository
   *
   * @deprecated Use loadLeague() for incremental processing
   */
  async load(
    leagues: LeagueEntity[],
    tableResults: FlipTableResults,
    currencyResults: CurrencyResultsMap,
    timestamps: UpdateTimestamps,
  ): Promise<void> {
    console.log('Storing leagues in memory...');
    await this.dataStorageService.dataStorageRepository.setLeagues(leagues);

    console.log('Storing processed data...');
    await this.dataStorageService.storeAllData(
      leagues,
      tableResults,
      currencyResults,
      timestamps,
    );
  }
}
