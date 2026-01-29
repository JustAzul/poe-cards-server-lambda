export interface ItemOverview {
  name: string;
  itemClass: number;
  chaosValue: number;
  exaltedValue?: number;
  corrupted?: boolean;
  links?: number;
  gemLevel?: number;
  count?: number;
  stackSize?: number;
  artFilename?: string;
  flavourText?: string;
  detailsId?: string;
}
