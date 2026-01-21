/* eslint-disable no-console */
import { sleep } from 'azul-tools';
import { duration } from 'moment';

// Domain entities and types
import { LeagueEntity } from '@domain/entities/league.entity';
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

/** Maps league names to their last update timestamp (ISO string) */
type UpdateTimestamps = Record<string, string>;

/** Maps league names to their flip table results */
type FlipTableResults = Record<string, FlipTableRowDto[]>;

/** Maps league names to their currency data */
type CurrencyResultsMap = Record<string, CurrencyOverview[]>;

/** League data combining items and currency */
type LeagueDataMap = Record<string, Array<ItemOverview | CurrencyItem>>;

/**
 * processing league data orchestration
 * Coordinates fetching, processing, and storing of all league data
 */
export class App {
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
    const { leagues, rawData, timestamps } = await this.extract();
    const { tableResults, currencyResults } = await this.transform(rawData);
    await this.load(leagues, tableResults, currencyResults, timestamps);
  }

  /**
   * Extract phase: Fetch raw league data from API with rate limiting
   */
  private async extract(): Promise<{
    leagues: Record<string, LeagueEntity>;
    rawData: LeagueDataMap;
    timestamps: UpdateTimestamps;
  }> {
    console.log('Fetching Leagues..');

    const leaguesArray = await this.leagueRepository.getAllLeagues();
    const filteredLeagues = leaguesArray
      .filter(({ leagueName }) => leagueName.indexOf('SSF') === -1) // remove Solo Self Found leagues
      .filter(({ delveEvent }) => !delveEvent)
      .filter(({ realm }) => realm === 'pc')
      .filter(({ leagueName }) => leagueName !== 'Hardcore'); // remove Standard Hardcore league

    console.log(`Found ${leaguesArray.length} leagues, filtered to ${filteredLeagues.length} leagues for processing.`);

    const leagues: Record<string, LeagueEntity> = {};
    filteredLeagues.forEach((league) => {
      leagues[league.leagueName] = league;
    });

    const timestamps: UpdateTimestamps = {};
    const rawData: LeagueDataMap = {};

    // Sequential processing with rate limiting to respect API constraints
    for (let i = 0; i < filteredLeagues.length; i += 1) {
      const { leagueName } = filteredLeagues[i];

      console.log(`Requesting league '${leagueName}' Overview..`);

      // eslint-disable-next-line no-await-in-loop
      rawData[leagueName] = await this.leagueDataService.fetchLeagueOverview(leagueName);
      timestamps[leagueName] = new Date().toISOString();

      if (i !== filteredLeagues.length - 1) {
        console.log('Waiting 2 seconds delay..');
        // eslint-disable-next-line no-await-in-loop
        await sleep(duration(2, 'seconds').asMilliseconds());
      }
    }

    return { leagues, rawData, timestamps };
  }

  /**
   * Transform phase: Process raw league data into structured results
   */
  private async transform(rawData: LeagueDataMap): Promise<{
    tableResults: FlipTableResults;
    currencyResults: CurrencyResultsMap;
  }> {
    console.log('Generating tables and mapping results...');

    const tableResults: FlipTableResults = {};
    const currencyResults: CurrencyResultsMap = {};

    const leagueNames = Object.keys(rawData);

    // Process all leagues using array methods
    leagueNames.forEach((leagueName) => {
      currencyResults[leagueName] = rawData[leagueName]
        .filter(isCurrencyItem)
        .map((Item: CurrencyItem): CurrencyOverview => ({
          Name: Item.currencyTypeName,
          detailsId: '', // CurrencyItem doesn't have detailsId
          chaosEquivalent: Item.chaosEquivalent,
        })) as CurrencyOverview[];

      tableResults[leagueName] = this.profitCalculationService
        .generateFlipTable(rawData[leagueName]);
    });

    return { tableResults, currencyResults };
  }

  /**
   * Load phase: Store all processed data
   */
  private async load(
    leagues: Record<string, LeagueEntity>,
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

export const processLeaguesDataUseCase = new App(
  defaultLeagueRepository,
  defaultLeagueDataService,
  defaultProfitCalculationService,
  defaultDataStorageService,
);
