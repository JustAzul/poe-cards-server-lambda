// Path of Exile API - Leagues Response
export interface LeagueApiResponse {
  id: string;
  realm: string;
  url: string;
  event?: boolean;
}

export interface LeaguesRecord {
  [leagueName: string]: {
    leagueName: string;
    ladder: string;
  };
}

// poe.ninja API - Item Overview Response
export interface ItemOverviewApiResponse {
  lines: ItemOverview[];
}

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

// poe.ninja API - Currency Overview Response
export interface CurrencyOverviewApiResponse {
  lines: CurrencyItem[];
}

export interface CurrencyItem {
  currencyTypeName: string;
  chaosEquivalent: number;
  receive?: {
    count: number;
  };
}

// HTTP Repository Configuration
export interface HttpRetryConfig {
  maxRetries: number;          // Maximum retry attempts (default: 3)
  baseDelayMs: number;         // Base delay in milliseconds (default: 2000)
  exponentialBackoff: boolean; // Use exponential backoff (default: true)
}
