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

  readonly artFilename?: string;

  readonly flavourText?: string;

  readonly detailsId?: string;

  constructor(data: {
    name: string;
    itemClass: number;
    chaosValue: number;
    corrupted?: boolean;
    links?: number;
    gemLevel?: number;
    count?: number;
    stackSize?: number;
    artFilename?: string;
    flavourText?: string;
    detailsId?: string;
  }) {
    this.name = data.name;
    this.itemClass = data.itemClass;
    this.chaosValue = data.chaosValue;
    this.corrupted = data.corrupted;
    this.links = data.links;
    this.gemLevel = data.gemLevel;
    this.count = data.count;
    this.stackSize = data.stackSize;
    this.artFilename = data.artFilename;
    this.flavourText = data.flavourText;
    this.detailsId = data.detailsId;
  }

  /**
   * Create ItemOverview from plain object (e.g., from API)
   */
  static fromRaw(data: Record<string, unknown>): ItemOverview {
    return new ItemOverview(data as ConstructorParameters<typeof ItemOverview>[0]);
  }

  /**
   * Get effective stack size (defaults to 1)
   */
  getStackSize(): number {
    return this.stackSize ?? 1;
  }

  /**
   * Get item count for trust validation (defaults to 0)
   */
  getCount(): number {
    return this.count ?? 0;
  }

  /**
   * Convert to plain object for serialization
   */
  toPlain(): Record<string, unknown> {
    return {
      name: this.name,
      itemClass: this.itemClass,
      chaosValue: this.chaosValue,
      ...(this.corrupted !== undefined && { corrupted: this.corrupted }),
      ...(this.links !== undefined && { links: this.links }),
      ...(this.gemLevel !== undefined && { gemLevel: this.gemLevel }),
      ...(this.count !== undefined && { count: this.count }),
      ...(this.stackSize !== undefined && { stackSize: this.stackSize }),
      ...(this.artFilename && { artFilename: this.artFilename }),
      ...(this.flavourText && { flavourText: this.flavourText }),
      ...(this.detailsId && { detailsId: this.detailsId }),
    };
  }
}
