import { League } from '@domain/entities/league.entity';

/**
 * League Repository Port - Interface contract for league data access
 * Decouples domain from infrastructure persistence
 */
export interface ILeagueRepository {
  getAllLeagues(): Promise<League[]>;
}
