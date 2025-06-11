export interface PoeNinjaCurrencyOverviewLine {
  readonly chaosEquivalent: number;
  readonly currencyTypeName: string;
  readonly detailsId: string;
}

export default class CurrencyOverviewEntity {
  private readonly props: PoeNinjaCurrencyOverviewLine;

  constructor(props: PoeNinjaCurrencyOverviewLine) {
    this.props = props;
  }

  get name(): string {
    return this.props.currencyTypeName;
  }

  get chaosValue(): number {
    return this.props.chaosEquivalent;
  }

  get detailsId(): string {
    return this.props.detailsId;
  }
}
