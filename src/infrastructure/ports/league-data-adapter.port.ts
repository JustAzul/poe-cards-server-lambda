import { League } from '@domain/entities/league.entity';
import { EnrichedLeagueDataYield } from '@infrastructure/types/enriched-league-data';

/**
 * Port for fetching batch league overview data with rate limiting
 */
export interface ILeagueDataAdapter {
  fetchBatchLeagueOverview(leagues: League[]): AsyncGenerator<EnrichedLeagueDataYield>;
}
