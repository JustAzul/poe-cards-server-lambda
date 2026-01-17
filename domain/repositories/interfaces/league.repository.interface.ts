import { League } from '@domain/entities/league.entity';

export interface ILeagueRepository {
  /**
   * Fetches all active leagues from PoE API
   * Filters out SSF, event leagues, hardcore, and non-PC realms
   */
  getAllLeagues(): Promise<Record<string, League>>;

  /**
   * Gets a specific league by name
   */
  getLeagueByName(leagueName: string): Promise<League | undefined>;

  /**
   * Checks if a league exists and is active
   */
  isLeagueActive(leagueName: string): Promise<boolean>;

  /**
   * Clears the internal cache (useful for testing or forced refresh)
   */
  clearCache(): void;
}
