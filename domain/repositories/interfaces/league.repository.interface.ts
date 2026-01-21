import { LeagueEntity } from '@domain/entities/league.entity';

export interface ILeagueRepository {
  /**
   * Fetches all active leagues from PoE API
   */
  getAllLeagues(): Promise<LeagueEntity[]>;

  /**
   * Clears the internal cache (useful for testing or forced refresh)
   */
  clearCache(): void;
}
