// poe.ninja API - Currency exchange data point (used in pay/receive fields)
export interface PoeNinjaCurrencyExchange {
  id: number;
  league_id: number;
  pay_currency_id: number;
  get_currency_id: number;
  sample_time_utc: string;
  count: number;
  value: number;
  data_point_count: number;
  includes_secondary: boolean;
  listing_count: number;
}

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

// poe.ninja API - Raw currency line from Currency Overview endpoint
export interface PoeNinjaCurrencyLine {
  currencyTypeName: string;
  chaosEquivalent: number;
  receive?: PoeNinjaCurrencyExchange;
  pay?: PoeNinjaCurrencyExchange;
  detailsId?: string;
}

// poe.ninja API - Item Overview Response
export interface ItemOverviewApiResponse {
  lines: PoeNinjaItemLine[];
}

// poe.ninja API - Currency Overview Response
export interface CurrencyOverviewApiResponse {
  lines: PoeNinjaCurrencyLine[];
}
