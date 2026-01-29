/* eslint-disable no-console */

// Domain entities
import { LeagueEntity } from '@domain/entities/league.entity';
import { FlipTableRowDto } from '@application/dtos/flip-table.dto';

// Application services
import { StorageService } from '@application/services/storage.service';

// Interfaces
import { CurrencyOverview } from '@domain/repositories/interfaces/data-storage.repository.interface';

/**
 * Service responsible for loading processed data into storage
 * Delegates to StorageService for actual data persistence
 */
export class LoadService {
  constructor(
    private readonly storageService: StorageService,
  ) {}

  /**
   * Load a single league's data incrementally into storage
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

    await this.storageService.storeLeagueData(league, flipTable, currency, timestamp);
  }
}
