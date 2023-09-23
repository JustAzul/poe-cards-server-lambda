import LEAGUES_TO_IGNORE from '../constants/leagues-to-ignore';

import type { LeagueResponse } from '../types/league-response.type';

export default class FetchUtils {
  public static FilterLeagues(
    leaguesResponse: LeagueResponse[],
  ): LeagueResponse[] {
    return leaguesResponse
      .filter(({ id: leagueName }) => !leagueName.includes('SSF')) // Removing SSF leagues
      .filter(({ realm }) => realm === 'pc') // Picking pc leagues
      .filter(({ event }) => !event) // Removing event leagues
      .filter(({ id: leagueName }) => !LEAGUES_TO_IGNORE.includes(leagueName));
  }
}