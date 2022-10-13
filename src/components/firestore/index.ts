import { LeagueResponse } from '../../types/league-response.type';
import db from './firestore';
import utils from '../utils';

export default class Database {
  private static leaguesDoc = db.collection('leagues').doc('all');

  static async updateLeaguesDocument(
    leaguesByName: Map<string, LeagueResponse>,
  ): Promise<void> {
    await this.leaguesDoc.set(utils.parseLeagueDetails(leaguesByName));
    console.log('Leagues Document is up to date.');
  }
}
