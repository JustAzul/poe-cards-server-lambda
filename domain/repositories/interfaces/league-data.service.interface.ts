import { ItemOverview, CurrencyItem } from '@domain/entities/http.entity';
import { LeagueEntity } from '@domain/entities/league.entity';
import { LeagueDataYield } from '@infrastructure/services/league-data.service';

export interface ILeagueDataService {
  fetchLeagueOverview(leagueName: string): Promise<Array<ItemOverview | CurrencyItem>>;
  fetchBatchLeagueOverview(leagues: LeagueEntity[]): AsyncGenerator<LeagueDataYield>;
}
