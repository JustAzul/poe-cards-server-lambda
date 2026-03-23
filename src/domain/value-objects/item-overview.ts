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

  // Infrastructure-facing fields: artFilename and flavourText are poe.ninja presentation
  // data read by ArbitrageMapper for the output DTO. explicitModifiers is read by
  // RewardParserService for card reward parsing. These will be extracted to PoeNinjaItemDto
  // when the Supabase LoadAdapter is implemented and the mapper no longer needs to reach
  // into the domain VO for presentation data.
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
   * Get item count for trust validation (defaults to 0)
   */
  getCount(): number {
    return this.count ?? 0;
  }
}
