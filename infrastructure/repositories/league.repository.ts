import { League } from '@domain/entities/league.entity';
import { ILeagueRepository } from '@domain/repositories/interfaces/league.repository.interface';

const { LeaguesOverview } = require('../../components/fetch');

export class LeagueRepository implements ILeagueRepository {
  private cache: Record<string, League> | null = null;
  private cacheTimestamp: number = 0;
  private readonly CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

  async getAllLeagues(): Promise<Record<string, League>> {
    // Return cached data if still valid
    if (this.cache && Date.now() - this.cacheTimestamp < this.CACHE_TTL_MS) {
      return this.cache;
    }

    // Fetch fresh data from API
    const leagues = await LeaguesOverview();
    this.cache = leagues;
    this.cacheTimestamp = Date.now();

    return leagues;
  }

  async getLeagueByName(leagueName: string): Promise<League | undefined> {
    const leagues = await this.getAllLeagues();
    return leagues[leagueName];
  }

  async isLeagueActive(leagueName: string): Promise<boolean> {
    const league = await this.getLeagueByName(leagueName);
    return league !== undefined;
  }

  clearCache(): void {
    this.cache = null;
    this.cacheTimestamp = 0;
  }
}

export const leagueRepository = new LeagueRepository();
