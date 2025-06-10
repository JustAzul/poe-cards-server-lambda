import { IsoDate } from './iso-date.type';
import { LeagueName } from './league-name.type';
import { LeagueRealms } from './league-realms.type';
import { LeagueRule } from './league-rule.type';

export type LeagueResponse = {
  delveEvent: boolean;
  description: string;
  endAt: IsoDate | null;
  event?: boolean;
  id: LeagueName;
  realm: LeagueRealms;
  registerAt: IsoDate;
  rules: LeagueRule[];
  startAt: IsoDate;
  timedEvent?: boolean;
  url: string;
};
