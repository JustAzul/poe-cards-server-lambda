import { ILeagueRepository } from '@domain/repositories/league.repository';
import { League } from '@domain/entities/league.entity';

import { IHttpService } from '@infrastructure/adapters/http/interfaces/http.service.interface';
import { httpService as defaultHttpService } from '@infrastructure/adapters/http/http.service';

const FIVE_MINUTES_MS = 5 * 60 * 1000;

export class LeagueRepository implements ILeagueRepository {
  private cache: League[] | null = null;

  private cacheTimestamp: number = 0;

  private readonly CACHE_TTL_MS = FIVE_MINUTES_MS;

  constructor(private readonly httpService: IHttpService = defaultHttpService) {}

  async getAllLeagues(): Promise<League[]> {
    if (this.cache && Date.now() - this.cacheTimestamp < this.CACHE_TTL_MS) {
      return this.cache;
    }

    const leagues = await this.httpService.fetchLeagues();

    const mappedLeagues = leagues.map((league) => ({
      name: league.name,
      ladder: league.url,
      delveEvent: league.delveEvent,
      realm: league.realm,
    }));

    this.cache = mappedLeagues;
    this.cacheTimestamp = Date.now();

    return mappedLeagues;
  }
}

export const leagueRepository = new LeagueRepository();
