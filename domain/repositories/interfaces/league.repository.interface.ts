import { LeagueEntity } from '@domain/entities/league.entity';

export interface ILeagueRepository {
  getAllLeagues(): Promise<LeagueEntity[]>;
}
