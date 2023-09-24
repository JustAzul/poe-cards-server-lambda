interface Rule {
  description: string;
  id: string;
  name: string;
}

export interface LeagueEntityProps {
  // ancestorEvent?: boolean;
  delveEvent: boolean;
  // description: string;
  endAt: string | null;
  id: string;
  realm: string;
  // registerAt: string;
  rules: Rule[];
  startAt: string | null;
  timedEvent?: boolean;
  url: string;
}

export default class LeagueEntity {
  private readonly props: LeagueEntityProps;

  constructor(props: LeagueEntityProps) {
    this.props = props;
  }

  private hasRule(ruleID: string): boolean {
    return this.rules.some(({ id }) => id === ruleID);
  }

  isHardcore(): boolean {
    return this.hasRule('Hardcore');
  }

  isSSF(): boolean {
    return this.hasRule('NoParties');
  }

  isRuthless(): boolean {
    return this.hasRule('HardMode');
  }

  shouldFilter(): boolean {
    if (this.name === 'Standard') {
      return true;
    }

    return this.isSSF() || this.isRuthless();
  }

  get name(): string {
    return this.props.id;
  }

  get realm(): string {
    return this.props.realm;
  }

  get rules(): Rule[] {
    return this.props.rules;
  }

  get rankingURL(): string {
    return this.props.url;
  }

  get startAt(): Date | null {
    return this.props.startAt ? new Date(this.props.startAt) : null;
  }

  get endAt(): Date | null {
    return this.props.endAt ? new Date(this.props.endAt) : null;
  }

  get isTimedEvent(): boolean {
    return Boolean(this.props.timedEvent);
  }

  get hasDelveEvent(): boolean {
    return Boolean(this.props.delveEvent);
  }
}
