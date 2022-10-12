import { LeagueName } from '../types/league-name.type';
import { LeagueResponse } from '../types/league-response.type';

export default {
  findLeagueResponseByName(leagueResponses: LeagueResponse[]): Map<LeagueName, LeagueResponse> {
    const leaguesWithDetails: Map<LeagueName, LeagueResponse> = new Map();

    for (let i = 0; i < leagueResponses.length; i += 1) {
      const leagueResponse = leagueResponses[i];
      leaguesWithDetails.set(leagueResponse.id, leagueResponse);
    }

    leagueResponses.map(({ id: leagueName, url: ladderUrl }) => ({
      leagueName,
      ladder: ladderUrl,
    }));

    return leaguesWithDetails;
  },
};
