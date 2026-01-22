/* eslint-disable no-console */

// Domain entities
import { LeagueEntity } from '@domain/entities/league.entity';
import { ItemOverview, CurrencyItem } from '@domain/entities/http.entity';

// Interfaces
import { ILeagueRepository } from '@domain/repositories/interfaces/league.repository.interface';
import { ILeagueDataService } from '@domain/repositories/interfaces/league-data.service.interface';

export interface LeagueExtractionYield {
  league: LeagueEntity;
  data: Array<ItemOverview | CurrencyItem>;
  timestamp: string;
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
   * Generator function that yields data for each league as it's extracted
   *
   * Fetches all leagues, applies filtering criteria, and delegates
   * to leagueDataService for batch processing with API rate limiting
   *
   * @yields Individual league extraction result for each league
   */
  async* extract(): AsyncGenerator<LeagueExtractionYield> {
    console.log('Fetching Leagues..');

    const leagues = await this.leagueRepository.getAllLeagues();
    const filteredLeagues = ExtractService.selectLeagues(leagues);

    console.log(`Found ${leagues.length} leagues, filtered to ${filteredLeagues.length} leagues for processing.`);
    yield* this.leagueDataService.fetchBatchLeagueOverview(filteredLeagues);
  }

  private static selectLeagues(leagues: LeagueEntity[]): LeagueEntity[] {
    return leagues
      .filter(({ name }) => name.indexOf('SSF') === -1) // remove Solo Self Found leagues
      .filter(({ delveEvent }) => !delveEvent)
      .filter(({ realm }) => realm === 'pc')
      .filter(({ name }) => name !== 'Hardcore'); // remove Standard(Hardcore) league
  }
}
