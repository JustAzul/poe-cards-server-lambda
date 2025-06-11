import { ItemClass } from './item-class.enum';

export interface PoeNinjaItemOverviewLine {
  readonly name: string;
  readonly chaosValue: number;
  readonly detailsId: string;
  readonly stackSize?: number;
  readonly itemClass?: ItemClass;
}

export default class ItemOverviewEntity {
  private readonly props: PoeNinjaItemOverviewLine;

  constructor(props: PoeNinjaItemOverviewLine) {
    this.props = props;
  }

  get name(): string {
    return this.props.name;
  }

  get chaosValue(): number {
    return this.props.chaosValue;
  }

  get detailsId(): string {
    return this.props.detailsId;
  }

  get stackSize(): number | undefined {
    return this.props.stackSize;
  }

  get itemClass(): ItemClass | undefined {
    return this.props.itemClass;
  }
}
