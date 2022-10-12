import { IsoDate } from './iso-date.type';
import { LeagueName } from './league-name.type';
import { LeagueRule } from './league-rule.type';

// TODO: this probably need some work
type Realms = 'pc';

export type LeagueResponse = {
    delveEvent: boolean;
    description: string;
    endAt: IsoDate | null;
    event?: boolean;
    id: LeagueName;
    realm: Realms;
    registerAt: IsoDate;
    rules: LeagueRule[];
    startAt: IsoDate;
    timedEvent?: boolean;
    url: string;
}
