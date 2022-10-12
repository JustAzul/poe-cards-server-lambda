import { LeagueName } from '../types/league-name.type';
import { LeagueResponse } from '../types/league-response.type';
import { LeagueWithLadderUrl } from '../types/league-with-ladder-url.type';

export default {
  findLeagueResponseByName(leagueResponses: LeagueResponse[]): Map<LeagueName, LeagueResponse> {
    const leaguesWithDetails: Map<LeagueName, LeagueResponse> = new Map();

    for (let i = 0; i < leagueResponses.length; i += 1) {
      const leagueResponse = leagueResponses[i];
      leaguesWithDetails.set(leagueResponse.id, leagueResponse);
    }

    return leaguesWithDetails;
  },

  parseLeagueDetails(
    leaguesByName: Map<LeagueName, LeagueResponse>,
  ): { [leagueName: LeagueName]: LeagueWithLadderUrl } {
    return Object.fromEntries(
      Array.from(
        leaguesByName.values(),
      ).map(({ id: leagueName, url }) => [leagueName, {
        leagueName,
        ladder: url,
      }])
      ,
    );
  },
};
