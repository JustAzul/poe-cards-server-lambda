import { League } from '@domain/entities/league.entity';
import { LeagueDataYield } from '@infrastructure/services/league.service';

export interface ILeagueService {
  fetchBatchLeagueOverview(leagues: League[]): AsyncGenerator<LeagueDataYield>;
}
