// Domain entities
import { League } from '@domain/entities/league.entity';
import { ItemOverview } from '@domain/value-objects/item-overview';
import { CurrencyItem } from '@domain/value-objects/currency-item';
import { DivinationCard } from '@domain/entities/card.entity';
import { RewardParserService } from '@domain/services/reward-parser.service';

// Infrastructure
import { ILeagueDataAdapter } from '@infrastructure/ports/league-data-adapter.port';
import { PoeNinjaItemMeta } from '@infrastructure/types/poe-ninja-item-meta';
import { Logger } from '@shared/logger';

// Interfaces
import { ILeagueRepository } from '@domain/repositories/league.repository';

export interface LeagueExtractionData {
  items: ItemOverview[];
  currency: CurrencyItem[];
  cards: DivinationCard[];
  itemMeta: Map<string, PoeNinjaItemMeta>;
  timestamp: string;
}

export interface LeagueExtractionYield {
  league: League;
  data: LeagueExtractionData;
  /** Set when league extraction failed; data fields are empty in that case */
  error?: Error;
}

export interface IExtractAdapter {
  extract(): AsyncGenerator<LeagueExtractionYield>;
}

/**
 * ETL Pipeline Extract Adapter
 * Responsible for extracting raw league data from API
 * Handles league filtering and rate-limited data fetching
 */
export class ExtractAdapter implements IExtractAdapter {
  constructor(
    private readonly leagueRepository: ILeagueRepository,
    private readonly rewardParser: RewardParserService,
    private readonly leagueAdapter: ILeagueDataAdapter,
    private readonly logger: Logger,
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
    this.logger.log('Fetching Leagues..');

    const leagues = await this.leagueRepository.getAllLeagues();
    const filteredLeagues = ExtractAdapter.selectLeagues(leagues);

    this.logger.log(`Found ${leagues.length} leagues, filtered to ${filteredLeagues.length} leagues for processing.`);

    for await (const result of this.leagueAdapter.fetchBatchLeagueOverview(filteredLeagues)) {
      if (result.error) {
        yield {
          league: result.league,
          data: {
            items: [],
            currency: [],
            cards: [],
            itemMeta: new Map(),
            timestamp: '',
          },
          error: result.error,
        };
      } else {
        const {
          league, items, currency, timestamp, cardLines, itemMeta,
        } = result;
        const cards = this.rewardParser.parseAll(cardLines);

        yield {
          league,
          data: {
            items,
            currency,
            cards,
            itemMeta,
            timestamp,
          },
        };
      }
    }
  }

  private static selectLeagues(leagues: League[]): League[] {
    return leagues.filter((league) => league.isEligible());
  }
}
