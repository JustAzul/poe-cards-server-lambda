import { LeagueResponse } from '../../types/league-response.type';
import db from './firestore';
import utils from '../utils';

export default {
  async updateLeaguesDocument(leaguesByName: Map<string, LeagueResponse>): Promise<void> {
    const leaguesDoc = db.collection('leagues').doc('all');

    await leaguesDoc.set(
      utils.parseLeagueDetails(leaguesByName),
    );

    console.log('Leagues Document is up to date.');
  },
};
