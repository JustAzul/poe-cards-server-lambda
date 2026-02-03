import { ILeagueRepository } from '@domain/repositories/league.repository';
import { League } from '@domain/entities/league.entity';

import { IHttpService, httpService as _httpService } from '@infrastructure/adapters/http/http.service';

export class LeagueRepository implements ILeagueRepository {
  constructor(private readonly httpService: IHttpService = _httpService) {}

  async getAllLeagues(): Promise<League[]> {
    const leagues = await this.httpService.fetchLeagues();

    const mappedLeagues = leagues.map(
      (league) => new League(
        league.name,
        league.url,
        league.delveEvent,
        league.realm,
        league.startAt ? new Date(league.startAt) : null,
        league.endAt ? new Date(league.endAt) : null,
        league.rules.map((rule) => rule.id),
      ),
    );

    return mappedLeagues;
  }
}

export const leagueRepository = new LeagueRepository();
