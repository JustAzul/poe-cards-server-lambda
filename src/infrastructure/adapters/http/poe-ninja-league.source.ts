import { ILeagueRepository } from '@domain/repositories/league.repository';
import { League } from '@domain/entities/league.entity';
import { PoeNinjaIndexStateResponse } from '@infrastructure/types/poe-ninja-index-state.types';
import { HttpClient } from '@infrastructure/adapters/http/http-client';
import { Logger } from '@shared/logger';

const INDEX_STATE_URL = 'https://poe.ninja/poe1/api/data/index-state';
const DEFAULT_REALM = 'pc';

/**
 * League source backed by poe.ninja index-state.
 * Replaces the Cloudflare-blocked official leagues API. The source is already
 * scoped to PC economy leagues, so the mapped defaults pass eligibility and the
 * only downstream filter is the name exclusion in League.isEligible().
 */
export class PoeNinjaLeagueSource implements ILeagueRepository {
  constructor(
    private readonly client: HttpClient,
    private readonly logger: Logger,
  ) {}

  async getAllLeagues(): Promise<League[]> {
    const response = await this.client.get<PoeNinjaIndexStateResponse>(INDEX_STATE_URL);

    if (!Array.isArray(response?.economyLeagues)) {
      throw new Error("Expected 'economyLeagues' array from index-state, got none");
    }

    const validLeagues = response.economyLeagues.filter(
      (league) => typeof league.name === 'string' && league.name.length > 0
        && typeof league.url === 'string' && league.url.length > 0,
    );

    const droppedCount = response.economyLeagues.length - validLeagues.length;
    if (droppedCount > 0) {
      this.logger.warn(`[PoeNinjaLeagueSource] Dropped ${droppedCount} malformed economy league entries`);
    }

    return validLeagues.map((league) => new League({
      name: league.name,
      ladder: league.url,
      delveEvent: false,
      realm: DEFAULT_REALM,
      startAt: null,
      endAt: null,
      ruleIds: [],
    }));
  }
}
