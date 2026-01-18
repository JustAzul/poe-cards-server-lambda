import { sleep } from 'azul-tools';
import { duration } from 'moment';

// Domain entities and types
import { League } from '@domain/entities/league.entity';
import { ItemOverview, CurrencyItem } from '@domain/entities/http.entity';
import { isCurrencyItem } from '@domain/types';

// DTOs
import { FlipTableRowDto } from '@application/dtos/flip-table.dto';

// Interfaces
import { CurrencyOverview } from '@domain/repositories/interfaces/data-storage.repository.interface';
import { ILeagueRepository } from '@domain/repositories/interfaces/league.repository.interface';
import { ILeagueDataService, IProfitCalculationService } from '@application/interfaces/services.interface';
import { DataStorageService, dataStorageService as defaultDataStorageService } from '@application/services/data-storage.service';

// Repositories
import { leagueRepository as defaultLeagueRepository } from '@infrastructure/repositories/league.repository';

// Services
import { leagueDataService as defaultLeagueDataService } from '@application/services/league-data.service';
import { profitCalculationService as defaultProfitCalculationService } from '@application/services/profit-calculation.service';
import { IProcessLeaguesDataUseCase } from './interfaces/process-leagues-data.use-case.interface';

/** Maps league names to their last update timestamp (ISO string) */
type UpdateTimestamps = Record<string, string>;

/** Maps league names to their flip table results */
type FlipTableResults = Record<string, FlipTableRowDto[]>;

/** Maps league names to their currency data */
type CurrencyResultsMap = Record<string, CurrencyOverview[]>;

/** League data combining items and currency */
type LeagueDataMap = Record<string, Array<ItemOverview | CurrencyItem>>;

/**
 * Use-case for processing league data orchestration
 * Coordinates fetching, processing, and storing of all league data
 */
export class ProcessLeaguesDataUseCase implements IProcessLeaguesDataUseCase {
  constructor(
    private readonly leagueRepository: ILeagueRepository,
    private readonly leagueDataService: ILeagueDataService,
    private readonly profitCalculationService: IProfitCalculationService,
    private readonly dataStorageService: DataStorageService,
  ) {}

  /**
   * Execute the complete league data processing workflow
   */
  async execute(): Promise<void> {
    console.log('Fetching Leagues..');

    const Leagues: Record<string, League> = await this.leagueRepository.getAllLeagues();
    console.log(`Found ${Object.keys(Leagues).length} leagues!`);

    console.log('Storing leagues in memory...');
    await this.dataStorageService.dataStorageRepository.setLeagues(Leagues);

    const {
      results: LeagueDatas,
      updatedAt: UpdatedAt,
    }: {
        results: LeagueDataMap; updatedAt: UpdateTimestamps } = await this.getLeagueData(Leagues);

    console.log('Generating tables and mapping results...');
    const TableResults: FlipTableResults = {};
    const CurrencyResults: CurrencyResultsMap = {};

    const LeagueIdentifiers: string[] = Object.keys(LeagueDatas);

    // Generate flip tables in parallel
    const flipTablePromises = LeagueIdentifiers.map(async (leagueName: string) => {
      const Result: CurrencyOverview[] = LeagueDatas[leagueName]
        .filter(isCurrencyItem)
        .map((Item: CurrencyItem): CurrencyOverview => ({
          Name: Item.currencyTypeName,
          detailsId: '', // CurrencyItem doesn't have detailsId
          chaosEquivalent: Item.chaosEquivalent,
        }));

      CurrencyResults[leagueName] = Result;

      // Flip table generation workload
      TableResults[leagueName] = await this.profitCalculationService
        .generateFlipTable(LeagueDatas[leagueName]);
    });

    await Promise.all(flipTablePromises);

    console.log('Storing processed data...');
    await this.dataStorageService.storeAllData(
      Leagues,
      TableResults,
      CurrencyResults,
      UpdatedAt,
    );
  }

  private async getLeagueData(Leagues: Record<string, League>) {
    const UpdatedAt: UpdateTimestamps = {};
    const LeaguesData: League[] = Object.values(Leagues);
    const Results: LeagueDataMap = {};

    // Sequential processing with rate limiting to respect API constraints
    for (let i = 0; i < LeaguesData.length; i += 1) {
      const { leagueName } = LeaguesData[i];

      console.log(`Requesting league '${leagueName}' Overview..`);
      // eslint-disable-next-line no-await-in-loop
      Results[leagueName] = await this.leagueDataService.fetchLeagueOverview(leagueName);
      UpdatedAt[leagueName] = new Date().toISOString();

      if (i !== LeaguesData.length - 1) {
        console.log('Waiting 2 seconds delay..');
        // eslint-disable-next-line no-await-in-loop
        await sleep(duration(2, 'seconds').asMilliseconds());
      }
    }

    return {
      results: Results,
      updatedAt: UpdatedAt,
    };
  }
}

export const processLeaguesDataUseCase = new ProcessLeaguesDataUseCase(
  defaultLeagueRepository,
  defaultLeagueDataService,
  defaultProfitCalculationService,
  defaultDataStorageService,
);
