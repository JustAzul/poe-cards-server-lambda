/**
 * Item Overview - Immutable market pricing data for items
 * Value object representing item market information from pricing APIs
 */
export class ItemOverview {
  readonly name: string;

  readonly itemClass: number;

  readonly chaosValue: number;

  readonly corrupted?: boolean;

  readonly links?: number;

  readonly gemLevel?: number;

  readonly count?: number;

  readonly stackSize?: number;

  constructor(data: {
    name: string;
    itemClass: number;
    chaosValue: number;
    corrupted?: boolean;
    links?: number;
    gemLevel?: number;
    count?: number;
    stackSize?: number;
  }) {
    if (!data.name || typeof data.name !== 'string') {
      throw new Error('ItemOverview: name must be a non-empty string');
    }
    if (!Number.isFinite(data.chaosValue)) {
      throw new Error('ItemOverview: chaosValue must be a finite number');
    }
    if (typeof data.itemClass !== 'number' || !Number.isFinite(data.itemClass)) {
      throw new Error('ItemOverview: itemClass must be a finite number');
    }
    this.name = data.name;
    this.itemClass = data.itemClass;
    this.chaosValue = data.chaosValue;
    this.corrupted = data.corrupted;
    this.links = data.links;
    this.gemLevel = data.gemLevel;
    this.count = data.count;
    this.stackSize = data.stackSize;
  }

  /**
   * Get item count for trust validation
   * Returns 0 when count is undefined — treats missing data as insufficient trust
   */
  getCount(): number {
    return this.count ?? 0;
  }
}
