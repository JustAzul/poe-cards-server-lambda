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
}
