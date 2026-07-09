/**
 * Div-card price recovered from the poe.ninja exchange endpoint.
 * `chaosValue` is the primary value directly (exchange primary currency = chaos);
 * `volumePrimaryValue` is the liquidity signal that replaces listing `count`.
 */
export interface DivCardPrice {
  slug: string;
  name: string;
  chaosValue: number;
  volumePrimaryValue: number;
}

/**
 * Port for fetching divination-card prices from the poe.ninja exchange endpoint.
 */
export interface IDivCardPriceSource {
  fetchPrices(league: string): Promise<DivCardPrice[]>;
}
