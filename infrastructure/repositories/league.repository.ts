import { ILeagueRepository } from '@domain/repositories/interfaces/league.repository.interface';
import { LeagueEntity } from '@domain/entities/league.entity';

import { IHttpService } from '@infrastructure/services/interfaces/http.service.interface';
import { httpService as defaultHttpService } from '@infrastructure/services/http.service';

const FIVE_MINUTES_MS = 5 * 60 * 1000;

export class LeagueRepository implements ILeagueRepository {
  private cache: LeagueEntity[] | null = null;

  private cacheTimestamp: number = 0;

  private readonly CACHE_TTL_MS = FIVE_MINUTES_MS;

  constructor(private readonly httpService: IHttpService = defaultHttpService) {}

  async getAllLeagues(): Promise<LeagueEntity[]> {
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
