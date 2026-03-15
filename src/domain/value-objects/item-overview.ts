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

  // TODO: artFilename and flavourText are API-presentation fields that belong in PoeNinjaItemDto.
  // They remain here because ArbitrageMapper (infrastructure) reads them via MarketSnapshot.cardPrice.
  // Moving them requires carrying DTOs alongside VOs through the extraction pipeline.
  readonly artFilename?: string;

  readonly flavourText?: string;

  readonly explicitModifiers?: Array<{ text: string; optional: boolean }>;

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
    explicitModifiers?: Array<{ text: string; optional: boolean }>;
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
    this.explicitModifiers = data.explicitModifiers;
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

  // TODO: reshape for Supabase schema when LoadAdapter is implemented
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
    };
  }
}
