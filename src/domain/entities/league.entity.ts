const INELIGIBLE_RULE_IDS = ['NoParties', 'HardMode'] as const;
const PC_REALM = 'pc';
const HARDCORE_LEAGUE_NAME = 'Hardcore';

export class League {
  readonly name: string;

  readonly ladder: string;

  readonly delveEvent: boolean;

  readonly realm: string;

  readonly startAt: Date | null;

  readonly endAt: Date | null;

  readonly ruleIds: string[];

  constructor(data: {
    name: string;
    ladder: string;
    delveEvent: boolean;
    realm: string;
    startAt: Date | null;
    endAt: Date | null;
    ruleIds: string[];
  }) {
    this.name = data.name;
    this.ladder = data.ladder;
    this.delveEvent = data.delveEvent;
    this.realm = data.realm;
    this.startAt = data.startAt;
    this.endAt = data.endAt;
    this.ruleIds = data.ruleIds;
  }

  /** Whether this league is eligible for arbitrage analysis */
  isEligible(): boolean {
    if (this.startAt === null) return false;
    if (INELIGIBLE_RULE_IDS.some((id) => this.ruleIds.includes(id))) return false; // SSF / Ruthless
    if (this.realm !== PC_REALM) return false; // Console leagues
    if (this.name === HARDCORE_LEAGUE_NAME) return false;
    return true;
  }
}
