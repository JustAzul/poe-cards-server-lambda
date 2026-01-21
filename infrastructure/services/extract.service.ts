/* eslint-disable no-console */
import { sleep } from '@shared/utils';
import { duration } from 'moment';

// Domain entities
import { LeagueEntity } from '@domain/entities/league.entity';
import { ItemOverview, CurrencyItem } from '@domain/entities/http.entity';

// Interfaces
import { ILeagueRepository } from '@domain/repositories/interfaces/league.repository.interface';
import { ILeagueDataService } from '@application/interfaces/services.interface';

/** Maps league names to their last update timestamp (ISO string) */
type UpdateTimestamps = Record<string, string>;

/** League data combining items and currency */
type LeagueDataMap = Record<string, Array<ItemOverview | CurrencyItem>>;

/**
 * Result of the extraction phase
 */
export interface ExtractionResult {
  leagues: LeagueEntity[];
  rawData: LeagueDataMap;
  timestamps: UpdateTimestamps;
}

/**
 * Service responsible for extracting raw league data from API
 * Handles league filtering and rate-limited data fetching
 */
export class ExtractService {
  constructor(
    private readonly leagueRepository: ILeagueRepository,
    private readonly leagueDataService: ILeagueDataService,
  ) {}

  /**
   * Extract raw league data with filtering and rate limiting
   *
   * Fetches all leagues, applies filtering criteria, and retrieves
   * overview data for each qualifying league with API rate limiting
   */
  async extract(): Promise<ExtractionResult> {
    console.log('Fetching Leagues..');

    const leaguesArray = await this.leagueRepository.getAllLeagues();
    const filteredLeagues = leaguesArray
      .filter(({ leagueName }) => leagueName.indexOf('SSF') === -1) // remove Solo Self Found leagues
      .filter(({ delveEvent }) => !delveEvent)
      .filter(({ realm }) => realm === 'pc')
      .filter(({ leagueName }) => leagueName !== 'Hardcore'); // remove Standard Hardcore league

    console.log(`Found ${leaguesArray.length} leagues, filtered to ${filteredLeagues.length} leagues for processing.`);

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

    return { leagues: filteredLeagues, rawData, timestamps };
  }
}
