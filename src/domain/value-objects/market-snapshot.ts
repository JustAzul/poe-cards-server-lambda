import { ItemOverview } from '@domain/value-objects/item-overview';
import { CurrencyItem } from '@domain/value-objects/currency-item';

/**
 * Market Snapshot - Immutable pricing data for card and reward
 * Value object encapsulating market state at a specific point in time
 */
export class MarketSnapshot {
  readonly cardPrice: ItemOverview;

  readonly rewardPrice: ItemOverview | CurrencyItem;

  readonly leagueId: string;

  constructor(data: {
    cardPrice: ItemOverview;
    rewardPrice: ItemOverview | CurrencyItem;
    leagueId: string;
  }) {
    this.cardPrice = data.cardPrice;
    this.rewardPrice = data.rewardPrice;
    this.leagueId = data.leagueId;
  }
}
