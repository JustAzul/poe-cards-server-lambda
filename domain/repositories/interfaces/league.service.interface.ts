import { LeagueEntity } from '@domain/entities/league.entity';
import { LeagueDataYield } from '@infrastructure/services/league.service';

export interface ILeagueService {
  fetchBatchLeagueOverview(leagues: LeagueEntity[]): AsyncGenerator<LeagueDataYield>;
}
