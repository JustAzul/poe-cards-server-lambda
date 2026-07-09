import { CurrencyItem } from '@domain/value-objects/currency-item';

/**
 * Port for fetching currency prices from the poe.ninja exchange endpoint.
 * Replaces the decaying stash currency overview; matched to card rewards by name.
 */
export interface ICurrencyPriceSource {
  fetchCurrencyPrices(league: string): Promise<CurrencyItem[]>;
}
