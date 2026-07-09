const INELIGIBLE_RULE_IDS = ['NoParties', 'HardMode'] as const;
const PC_REALM = 'pc';
const EXCLUDED_LEAGUE_NAMES = ['Standard', 'Hardcore'] as const;

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
    if (!data.name || typeof data.name !== 'string') {
      throw new Error('League: name must be a non-empty string');
    }
    if (!data.realm || typeof data.realm !== 'string') {
      throw new Error('League: realm must be a non-empty string');
    }
    this.name = data.name;
    this.ladder = data.ladder;
    this.delveEvent = data.delveEvent;
    this.realm = data.realm;
    this.startAt = data.startAt;
    this.endAt = data.endAt;
    this.ruleIds = [...data.ruleIds];
  }

  /**
   * Whether this league is eligible for arbitrage analysis.
   * The league source (poe.ninja index-state) is pre-filtered to PC economy
   * leagues, so eligibility reduces to excluding the permanent leagues by name.
   */
  isEligible(): boolean {
    if (this.realm !== PC_REALM) return false; // Console leagues
    if (INELIGIBLE_RULE_IDS.some((id) => this.ruleIds.includes(id))) return false; // SSF / Ruthless

    // Standard / Hardcore — the permanent leagues, excluded by name
    if ((EXCLUDED_LEAGUE_NAMES as readonly string[]).includes(this.name)) return false;

    return true;
  }
}
