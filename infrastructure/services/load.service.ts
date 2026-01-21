/* eslint-disable no-console */

// Domain entities
import { LeagueEntity } from '@domain/entities/league.entity';

// DTOs
import { FlipTableRowDto } from '@application/dtos/flip-table.dto';

// Interfaces
import { CurrencyOverview } from '@domain/repositories/interfaces/data-storage.repository.interface';
import { DataStorageService } from '@application/services/data-storage.service';

/** Maps league names to their last update timestamp (ISO string) */
type UpdateTimestamps = Record<string, string>;

/** Maps league names to their flip table results */
type FlipTableResults = Record<string, FlipTableRowDto[]>;

/** Maps league names to their currency data */
type CurrencyResultsMap = Record<string, CurrencyOverview[]>;

/**
 * Service responsible for loading processed data into storage
 * Handles persisting leagues and processed results
 */
export class LoadService {
  constructor(
    private readonly dataStorageService: DataStorageService,
  ) {}

  /**
   * Load processed data into storage
   *
   * Stores leagues and their processed data (flip tables, currency results, timestamps)
   * into the data storage repository
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
