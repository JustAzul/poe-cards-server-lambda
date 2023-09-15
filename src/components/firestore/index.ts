import { LeagueResponse } from '../../types/league-response.type';
import Utils from '../utils';

import db from './firestore';

export default class Database {
  private static readonly leaguesDoc = db.collection('leagues').doc('all');

  public static async UpdateLeaguesDocument(
    leaguesByName: Map<string, LeagueResponse>,
  ): Promise<void> {
    await Database.leaguesDoc.set(Utils.GetLeaguesDocument(leaguesByName));
    // eslint-disable-next-line no-console
    console.log('Leagues Document is up to date.');
  }
}
