/* eslint-disable no-console */

// Domain entities
import { LeagueEntity } from '@domain/entities/league.entity';
import { ItemOverview } from '@domain/entities/item-overview.entity';
import { CurrencyItem } from '@domain/entities/currency-item.entity';
import { Card } from '@domain/entities/card.base.entity';

// Interfaces
import { ILeagueRepository } from '@domain/repositories/interfaces/league.repository.interface';
import { ICardRepository } from '@domain/repositories/interfaces/card.repository.interface';
import { ILeagueService } from '@infrastructure/services/interfaces/league.service.interface';

export interface LeagueExtractionData {
  items: ItemOverview[];
  currency: CurrencyItem[];
  cards: Card[];
  timestamp: string;
}

export interface LeagueExtractionYield {
  league: LeagueEntity;
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

    for await (const { league, items, currency, timestamp } of this.leagueService.fetchBatchLeagueOverview(filteredLeagues)) {
      yield {
        league,
        data: { items, currency, cards, timestamp },
      };
    }
  }

  private static selectLeagues(leagues: LeagueEntity[]): LeagueEntity[] {
    return leagues
      .filter(({ name }) => !name.includes('SSF') && !name.includes('Solo Self-Found')) // remove Solo Self Found leagues
      .filter(({ realm }) => realm === 'pc')
      .filter(({ name }) => name !== 'Hardcore'); // remove Standard(Hardcore) league
  }
}
