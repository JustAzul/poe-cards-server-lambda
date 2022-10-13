import { LeagueName } from './league-name.type';
import { LeagueWithLadderUrl } from './league-with-ladder-url.type';

export type LeaguesDocument = {
  [leagueName: LeagueName]: LeagueWithLadderUrl;
};
