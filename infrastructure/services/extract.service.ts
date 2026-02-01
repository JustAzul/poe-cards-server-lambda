/* eslint-disable no-console */

// Domain entities
import { League } from '@domain/entities/league.entity';
import { ItemOverview } from '@domain/value-objects/item-overview';
import { CurrencyItem } from '@domain/value-objects/currency-item';
import { DivinationCard } from '@domain/entities/card.entity';

// Interfaces
import { ILeagueRepository } from '@domain/repositories/league.repository';
import { ICardRepository } from '@domain/repositories/card.repository';
import { ILeagueService } from '@infrastructure/services/interfaces/league.service.interface';

export interface LeagueExtractionData {
  items: ItemOverview[];
  currency: CurrencyItem[];
  cards: DivinationCard[];
  timestamp: string;
}

export interface LeagueExtractionYield {
  league: League;
  data: LeagueExtractionData;
}

/**
 * Service responsible for extracting raw league data from API
 * Handles league filtering and rate-limited data fetching
 */
export class ExtractService {
  constructor(
    private readonly leagueRepository: ILeagueRepository,
    private readonly cardRepository: ICardRepository,
    private readonly leagueService: ILeagueService,
  ) {}

  /**
   * Extract raw league data with filtering and rate limiting
   * Generator function that yields data for each league as it's extracted
   *
   * Fetches all leagues and cards, applies filtering criteria, and delegates
   * to leagueService for batch processing with API rate limiting
   *
   * @yields Individual league extraction result for each league with cards
   */
  async* extract(): AsyncGenerator<LeagueExtractionYield> {
    console.log('Fetching Leagues..');

    const leagues = await this.leagueRepository.getAllLeagues();
    const filteredLeagues = ExtractService.selectLeagues(leagues);
    const cards = this.cardRepository.getAllCards();

    console.log(`Found ${leagues.length} leagues, filtered to ${filteredLeagues.length} leagues for processing.`);

    // Using for-await loop is necessary here to handle async iteration of batch league data
    // eslint-disable-next-line no-restricted-syntax
    for await (const {
      league,
      items,
      currency,
      timestamp,
    } of this.leagueService.fetchBatchLeagueOverview(filteredLeagues)) {
      yield {
        league,
        data: {
          items,
          currency,
          cards,
          timestamp,
        },
      };
    }
  }

  private static selectLeagues(leagues: League[]): League[] {
    return leagues
      .filter(({ name }) => !name.includes('SSF') && !name.includes('Solo Self-Found')) // remove Solo Self Found leagues
      .filter(({ realm }) => realm === 'pc')
      .filter(({ name }) => name !== 'Hardcore'); // remove Standard(Hardcore) league
  }
}
