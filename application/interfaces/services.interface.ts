import { ItemOverview } from '@domain/entities/item-overview.entity';
import { CurrencyItem } from '@domain/entities/currency-item.entity';
import { Card } from '@domain/entities/card.base.entity';
import { Arbitrage } from '@domain/models/arbitrage';

/**
 * Separated league data structure
 * Items and currency kept in distinct arrays for type safety
 */
export interface LeagueData {
  items: ItemOverview[];
  currency: CurrencyItem[];
}

// Card price resolver (Strategy Pattern)
export interface ICardPriceResolver {
  /**
   * Find matching divination card in items
   */
  findCardPrice(
    items: ItemOverview[],
    cardName: string
  ): ItemOverview | null;

  /**
   * Find matching reward in league data
   * Uses card type discriminator to determine matching strategy
   */
  findRewardPrice(
    items: ItemOverview[],
    currency: CurrencyItem[],
    cardDetails: Card
  ): ItemOverview | CurrencyItem | null;
}

// Arbitrage evaluator service
export interface IArbitrageEvaluator {
  evaluateCardArbitrage(
    leagueData: LeagueData,
    card: Card
  ): Arbitrage | null;

  findAllArbitrageOpportunities(
    leagueData: LeagueData,
    cards: Card[]
  ): Arbitrage[];
}
