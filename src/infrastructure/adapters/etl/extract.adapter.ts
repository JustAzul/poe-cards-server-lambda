// Domain entities
import { League } from '@domain/entities/league.entity';
import { ItemOverview } from '@domain/value-objects/item-overview';
import { CurrencyItem } from '@domain/value-objects/currency-item';
import { DivinationCard } from '@domain/entities/card.entity';
import { ItemClass } from '@domain/value-objects/item-class.enum';
import { RewardParserService } from '@domain/services/reward-parser.service';

// Interfaces
import { ILeagueRepository } from '@domain/repositories/league.repository';
import { ILeagueAdapter } from '@domain/ports/league-adapter.port';

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
 * ETL Pipeline Extract Adapter
 * Responsible for extracting raw league data from API
 * Handles league filtering and rate-limited data fetching
 */
export class ExtractAdapter {
  constructor(
    private readonly leagueRepository: ILeagueRepository,
    private readonly rewardParser: RewardParserService,
    private readonly leagueAdapter: ILeagueAdapter,
  ) {}

  /**
   * Extract raw league data with filtering and rate limiting
   * Generator function that yields data for each league as it's extracted
   *
   * Fetches all leagues, applies filtering criteria, and delegates
   * to leagueAdapter for batch processing with API rate limiting.
   * Cards are dynamically parsed from DivinationCard market data per-league.
   *
   * @yields Individual league extraction result for each league with cards
   */
  async* extract(): AsyncGenerator<LeagueExtractionYield> {
    console.log('Fetching Leagues..');

    const leagues = await this.leagueRepository.getAllLeagues();
    const filteredLeagues = ExtractAdapter.selectLeagues(leagues);

    console.log(`Found ${leagues.length} leagues, filtered to ${filteredLeagues.length} leagues for processing.`);

    for await (const {
      league,
      items,
      currency,
      timestamp,
    } of this.leagueAdapter.fetchBatchLeagueOverview(filteredLeagues)) {
      const divinationItems = items.filter(
        (item) => item.itemClass === ItemClass.DIVINATION_CARD,
      );
      const cards = this.rewardParser.parseAll(divinationItems);

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
    return leagues.filter((league) => league.isEligible());
  }
}
