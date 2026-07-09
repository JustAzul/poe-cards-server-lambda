// poe.ninja API - Raw item line from Item Overview endpoint
export interface PoeNinjaItemLine {
  name: string;
  itemClass: number;
  chaosValue: number;
  exaltedValue?: number;
  divineValue?: number;
  corrupted?: boolean;
  links?: number;
  gemLevel?: number;
  count?: number;
  listingCount?: number;
  stackSize?: number;
  artFilename?: string;
  flavourText?: string;
  detailsId?: string;
  explicitModifiers?: Array<{ text: string; optional: boolean }>;
}

// poe.ninja API - Item Overview Response
export interface ItemOverviewApiResponse {
  lines: PoeNinjaItemLine[];
}
