import { ILeagueRepository } from '@domain/repositories/league.repository';
import { League } from '@domain/entities/league.entity';

import { ILeagueApi } from '@domain/ports/http-service.port';

export class LeagueRepository implements ILeagueRepository {
  constructor(private readonly leagueApi: ILeagueApi) {}

  async getAllLeagues(): Promise<League[]> {
    const leagues = await this.leagueApi.fetchLeagues();

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
