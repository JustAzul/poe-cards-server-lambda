import {
  IArbitrageEvaluator,
  ICardPriceResolver,
  LeagueData,
} from '@application/interfaces/services.interface';
import { Card } from '@domain/entities/card.base.entity';
import { Arbitrage } from '@domain/models/arbitrage';

// Default instance with concrete dependencies
import { CardPriceResolver } from '@application/services/matchers/card.matcher';

export class ArbitrageEvaluator implements IArbitrageEvaluator {
  private readonly MIN_TRUST_COUNT = 10;

  constructor(
    private readonly cardPriceResolver: ICardPriceResolver,
  ) {}

  /**
   * Evaluate arbitrage opportunity for a single card using domain metadata
   */
  evaluateCardArbitrage(
    leagueData: LeagueData,
    card: Card,
  ): Arbitrage | null {
    const cardOverview = this.cardPriceResolver.findCardPrice(leagueData.items, card.name);
    const rewardOverview = this.cardPriceResolver.findRewardPrice(
      leagueData.items,
      leagueData.currency,
      card,
    );

    if (!cardOverview || !rewardOverview) return null;
    if (!card.validateTrust(cardOverview, rewardOverview, this.MIN_TRUST_COUNT)) return null;

    return card.calculateProfit(cardOverview, rewardOverview);
  }

  /**
   * Find all profitable arbitrage opportunities for cards
   */
  findAllArbitrageOpportunities(
    leagueData: LeagueData,
    cards: Card[],
  ): Arbitrage[] {
    return cards
      .map((card) => this.evaluateCardArbitrage(leagueData, card))
      .filter((result): result is Arbitrage => result !== null && result.chaosProfit > 0);
  }
}

// Singleton instance
const cardPriceResolver = new CardPriceResolver();

export const arbitrageEvaluator = new ArbitrageEvaluator(
  cardPriceResolver,
);
