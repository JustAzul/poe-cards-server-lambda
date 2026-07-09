// poe.ninja API - normalized exchange overview shape (bulk-traded types incl. DivinationCard)

// Reference currency descriptor inside `core.items`
export interface PoeNinjaExchangeCoreItem {
  id: string;
  name: string;
  detailsId?: string;
}

export interface PoeNinjaExchangeCore {
  primary: string;
  secondary?: string;
  rates?: Record<string, number>;
  items?: PoeNinjaExchangeCoreItem[];
}

// Item descriptor carrying the display name/detailsId for a traded id
export interface PoeNinjaExchangeItem {
  id: string;
  name: string;
  category?: string;
  detailsId?: string;
}

// Price line — joins to an item by `id`
export interface PoeNinjaExchangeLine {
  id: string;
  primaryValue: number;
  volumePrimaryValue?: number;
  maxVolumeCurrency?: string;
  maxVolumeRate?: number;
  sparkline?: unknown;
}

export interface PoeNinjaExchangeResponse {
  core: PoeNinjaExchangeCore;
  items: PoeNinjaExchangeItem[];
  lines: PoeNinjaExchangeLine[];
}
