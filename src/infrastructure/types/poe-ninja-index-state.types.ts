// poe.ninja API - Economy league entry from the index-state endpoint
export interface PoeNinjaEconomyLeague {
  name: string;
  url: string;
  displayName?: string;
}

// poe.ninja API - index-state response (only the economyLeagues slice is consumed)
export interface PoeNinjaIndexStateResponse {
  economyLeagues: PoeNinjaEconomyLeague[];
}
