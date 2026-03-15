import { ILeagueRepository } from '@domain/repositories/league.repository';
import { League } from '@domain/entities/league.entity';

import { IHttpService } from '@infrastructure/adapters/http/http.service';

export class LeagueRepository implements ILeagueRepository {
  constructor(private readonly httpService: IHttpService) {}

  async getAllLeagues(): Promise<League[]> {
    const leagues = await this.httpService.fetchLeagues();

    const mappedLeagues = leagues.map(
      (league) => new League({
        name: league.name,
        ladder: league.url,
        delveEvent: league.delveEvent,
        realm: league.realm,
        startAt: league.startAt ? new Date(league.startAt) : null,
        endAt: league.endAt ? new Date(league.endAt) : null,
        ruleIds: league.rules.map((rule) => rule.id),
      }),
    );

    return mappedLeagues;
  }
}
