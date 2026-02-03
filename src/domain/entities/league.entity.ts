export class League {
  name: string;

  ladder: string;

  delveEvent: boolean;

  realm: string;

  startAt: Date | null;

  endAt: Date | null;

  ruleIds: string[];

  constructor(
    name: string,
    ladder: string,
    delveEvent: boolean,
    realm: string,
    startAt: Date | null,
    endAt: Date | null,
    ruleIds: string[],
  ) {
    this.name = name;
    this.ladder = ladder;
    this.delveEvent = delveEvent;
    this.realm = realm;
    this.startAt = startAt;
    this.endAt = endAt;
    this.ruleIds = ruleIds;
  }
}
